"""Death/respawn test: for every chapter and every checkpoint, start there, die,
respawn from the checkpoint (the real restart path), and check that the level
is still playable: objective restored, marker present, key actors alive, and the
chapter can still be finished from that point.
Run: python3 tests/respawn.py [chapter ...]"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
FAIL, ERRS = [], []
OBJ = "document.getElementById('obj-text').textContent"
CPS = {1: 4, 2: 3, 3: 4, 4: 3, 5: 4, 6: 2, 7: 2, 8: 3, 9: 4, 10: 4}
# chapter-specific "is the level really playable" probes, per checkpoint (JS returning true/false or a string)
PROBE = {
 (1, 3): "__BL.cars()[0] && __BL.cars()[0].crashed && !!__BL.Mission.flags.case",
 (2, 0): "__BL.actors().some(a=>a.isAlly && a.name==='MAYA' && !a.disposed)",
 (2, 1): "__BL.actors().filter(a=>a.isAlly && !a.disposed).length===2 && __BL.Countdown.on",
 (3, 0): "!!__BL.Mission.marker()",
 (3, 3): "__BL.Countdown.on",
 (4, 0): "__BL.actors().some(a=>a.isAlly && !a.disposed) && __BL.enemies().filter(e=>e.alive&&e.group==='guard').length===7",
 (4, 1): "__BL.actors().filter(a=>a.isAlly && !a.disposed).length===2 && __BL.Countdown.on",
 (5, 0): "!!__BL.player.inVehicle && __BL.player.inVehicle.kind==='suv'",
 (5, 3): "!!__BL.Flight.jet && !__BL.Flight.jet.dead",
 (6, 0): "!!__BL.Flight.jet && !__BL.Flight.jet.dead",
 (7, 0): "Object.keys(__BL.inv()).join(',')==='fists' && !!__BL.Mission.marker()",
 (8, 0): "__BL.actors().some(a=>a.isAlly && !a.disposed)",
 (9, 2): "__BL.enemies().some(e=>e.isBoss && e.alive && e.mesh.parent)",
 (10, 0): "!!__BL.player.inVehicle && __BL.player.inVehicle.kind==='apc'",
 (10, 2): "__BL.targets().filter(t=>t.hpMax===1100 && !t.dead).length===3",
 (10, 3): "__BL.enemies().some(e=>e.hpMax>2000 && e.alive && e.mesh.parent)",
}
WAIT = "new Promise(r=>setTimeout(()=>r(__BL.state),2600))"
GOD = "__BL.player.hp=1e6;__BL.player.alive=true;"
KILL = "__BL.enemies().forEach(e=>e.alive&&!e.isBoss&&e.die(null,false,'player'));"
FINISH = {
 (10, 3): ("(()=>{const b=__BL.enemies().find(e=>e.hpMax>2000&&e.alive); if(!b) return 'NO BOSS'; for(let i=0;i<80&&!b.defeated;i++){ __BL.player.hp=100; __BL.player.alive=true; if(!b.shielded) b.damage(150,null,false,'player'); else __BL.targets().filter(t=>t.orb&&!t.dead).forEach(t=>t.damage(1000)); __BL.sim(0.4);} for(let i=0;i<34;i++){__BL.player.hp=100; __BL.sim(0.5);} return " + WAIT + ";})()", "choice"),
 (3, 3): ("(()=>{__BL.player.hp=100; __BL.tp(20,-165); __BL.sim(1.5); return __BL.state;})()", "end"),
 (1, 3): ("(()=>{__BL.enemies().forEach(e=>e.alive&&e.die(null,false,'player')); __BL.goStep(5); const c=__BL.Mission.flags.case; __BL.tp(c.pos.x+0.6,c.pos.z); __BL.sim(0.2); __BL.enter(); __BL.sim(1); return __BL.state;})()", "end"),
 (9, 3): ("(()=>{" + KILL + " __BL.tp(403,-10); __BL.sim(0.3); __BL.enter(); __BL.sim(1); return " + WAIT + ";})()", "choice"),
 (5, 3): ("(()=>{__BL.keys.KeyW=true; __BL.sim(3); for(let i=0;i<24;i++){ __BL.mouse(0,-6); __BL.sim(1/30);} for(let k=0;k<20&&__BL.state!=='end';k++) __BL.sim(1); return __BL.state;})()", "end"),
 (6, 1): ("(()=>{for(let k=0;k<40&&__BL.Mission.cur().id==='bombers';k++){ __BL.fighters().filter(f=>!f.dead).forEach(f=>f.damage(2000)); if(__BL.Flight.jet) __BL.Flight.jet.hp=100; __BL.sim(1);} for(let k=0;k<60&&__BL.state!=='end';k++) __BL.sim(1); return __BL.state;})()", "end"),
 (2, 2): ("(()=>{" + KILL + " const m=__BL.Mission.marker(); __BL.tp(m.x,m.z); for(let i=0;i<90&&__BL.state!=='end';i++){" + GOD + "__BL.sim(1);} return __BL.state;})()", "end"),
 (4, 2): ("(()=>{" + KILL + " __BL.tp(-118,94.5); for(let i=0;i<90&&__BL.state!=='end';i++){" + GOD + "__BL.sim(1);} return __BL.state;})()", "end"),
 (8, 2): ("(()=>{" + KILL + " __BL.tp(345,-10); for(let i=0;i<90&&__BL.state!=='end';i++){" + GOD + "__BL.sim(1);} return __BL.state;})()", "end"),
}
def check(name, ok, info=""):
    print(("PASS " if ok else "FAIL ") + name, str(info)[:170]); 
    if not ok: FAIL.append(name)
async def chapter(p, n):
    b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    page = await b.new_page(viewport={"width": 640, "height": 360}); page.set_default_timeout(240000)
    await page.add_init_script("localStorage.setItem('blackline_settings', JSON.stringify({quality:'low',shadows:false,effects:'low',aa:false,sens:1,fov:78,vol:0.8,music:0.5,invertY:false}))")
    page.on("console", lambda m: ERRS.append(f"[ch{n}] {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: ERRS.append(f"[ch{n}] PAGEERROR {e}"))
    await page.goto((ROOT / "dist" / "index.html").as_uri() + f"?m={n}")
    await page.wait_for_function("window.__BL && window.__BL.state==='menu'")
    ev = page.evaluate
    for cp in range(CPS[n]):
        await ev(f"(()=>{{__BL.cp({cp}); __BL.save(); __BL.sim(2);}})()")
        before = await ev(OBJ)
        # die (twice in a row for good measure) and respawn from the checkpoint each time
        for k in range(2):
            await ev("(()=>{ if(__BL.player.inJet && __BL.Flight.jet){ __BL.Flight.jet.hurt(999); } else __BL.die(); __BL.sim(2.5); })()")
            try: await page.wait_for_function("__BL.state==='dead'", timeout=8000)
            except Exception: print('  no death screen:', await ev("JSON.stringify({st:__BL.state, alive:__BL.player.alive, hp:__BL.player.hp, jet:!!__BL.player.inJet})"))
            st = await ev("__BL.state")
            await page.click('#btn-d-restart'); await ev("__BL.play(); __BL.sim(2);")
        after = await ev(OBJ)
        alive = await ev("__BL.player.alive && __BL.state==='play'")
        mk = await ev("(()=>{const m=__BL.Mission.marker(); return m===null ? 'none' : (m && isFinite(m.x) ? 'ok' : 'BAD');})()")
        check(f"ch{n} cp{cp} respawn restores objective", before == after and alive, f"{before!r} -> {after!r} dead-state={st}")
        check(f"ch{n} cp{cp} marker valid", mk != 'BAD', mk)
        if (n, cp) in PROBE:
            r = await ev(PROBE[(n, cp)]); check(f"ch{n} cp{cp} actors restored", r is True, r)
        if (n, cp) in FINISH:
            js, want = FINISH[(n, cp)]; r = await ev(js); check(f"ch{n} cp{cp} finishable after respawn", r == want, r)
    await b.close()
async def main():
    only = [int(a) for a in sys.argv[1:]] or list(range(1, 11))
    async with async_playwright() as p:
        for n in only: await chapter(p, n)
    print("\n".join(ERRS[:20]) or "NO CONSOLE ERRORS"); print(f"\n{len(FAIL)} failures, {len(ERRS)} console errors")
asyncio.run(main())
