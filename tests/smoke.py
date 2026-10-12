"""Headless playthrough test for all ten chapters of BLACKLINE: LAST HOUR.
Boots each chapter in Chromium (software WebGL), fast-forwards the simulation
through every objective via the window.__BL debug hook, and reports failures
and console errors.

Run:  python3 tests/smoke.py [screenshot_dir]
Needs: pip install playwright && python3 -m playwright install chromium
"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "tests" / "shots"
OUT.mkdir(parents=True, exist_ok=True)
FAIL, ERRS = [], []
OBJ = "document.getElementById('obj-text').textContent"

def check(name, ok, info=""):
    print(("PASS " if ok else "FAIL ") + name, str(info)[:160])
    if not ok: FAIL.append(name)

# Each chapter: list of (label, js, predicate(result) -> bool)
CH = {
 1: [
  ("camp objective", f"__BL.cp(0); __BL.sim(1); {OBJ}", lambda r: "supply camp" in r),
  ("take rifle", "__BL.cp(0); __BL.player.armor=100; __BL.tp(112,74.8); __BL.look(0,-0.3); __BL.sim(0.3); __BL.enter()", lambda r: r and "KR-7" in r),
  ("convoy objective", f"__BL.sim(1); {OBJ}", lambda r: "convoy" in r.lower()),
  ("airstrike + truck flees", "__BL.cp(2); __BL.player.armor=100; __BL.sim(7); !!__BL.cars()[0].ai", lambda r: r),
  ("drive pickup", "(()=>{const c=__BL.cars()[1]; __BL.tp(c.pos.x-2.3,c.pos.z); __BL.sim(0.1); return __BL.enter();})()", lambda r: r and "pickup" in r),
  ("bomber wrecks truck", "(()=>{__BL.sim(4); const t=__BL.cars()[0]; t.pos.z=-300; t.pos.x=0; const pc=__BL.player.inVehicle; pc.pos.set(0,pc.pos.y,-170); __BL.player.hp=100; __BL.player.armor=100; __BL.sim(16); return __BL.cars()[0].crashed;})()", lambda r: r),
  ("briefcase ends chapter", "(()=>{__BL.cp(3); __BL.enemies().forEach(e=>e.alive&&e.die(null,false,'player')); __BL.goStep(5); const c=__BL.Mission.flags.case; __BL.tp(c.pos.x+0.6,c.pos.z); __BL.sim(0.2); __BL.enter(); __BL.sim(1); return __BL.state;})()", lambda r: r == "end"),
 ],
 2: [
  ("maya ally", "(()=>{__BL.cp(0); __BL.sim(1); return __BL.actors().some(a=>a.isAlly);})()", lambda r: r),
  ("clear camp", "(()=>{__BL.player.hp=1e6;__BL.player.alive=true;__BL.goStep(1); __BL.sim(0.5); __BL.enemies().forEach(e=>e.alive&&!e.isAlly&&!e.isBoss&&e.die(null,false,'player')); __BL.sim(4); return " + OBJ + ";})()", lambda r: "Voss" in r),
  ("talk to Voss", "(()=>{const m=__BL.Mission.marker(); __BL.tp(m.x+1.5,m.z+1.5); __BL.sim(0.3); return __BL.enter();})()", lambda r: r and "Voss" in r),
  ("hold camp", "(()=>{for(let i=0;i<130&&!(__BL.Mission.cur().id==='extract');i++){__BL.player.hp=1e6;__BL.player.alive=true;__BL.sim(1);} return __BL.Mission.cur().id;})()", lambda r: r == "extract"),
  ("extract ends flashback", "(()=>{__BL.enemies().forEach(e=>e.alive&&!e.isAlly&&!e.isBoss&&e.die(null,false,'player')); const m=__BL.Mission.marker(); __BL.tp(m.x,m.z); for(let i=0;i<90&&!(__BL.state==='end');i++){__BL.player.hp=1e6;__BL.player.alive=true;__BL.sim(1);} return __BL.state;})()", lambda r: r == "end"),
 ],
 3: [
  ("override blast door", "(()=>{__BL.cp(0); __BL.player.armor=100; __BL.tp(2.4,-48.4); __BL.sim(0.1); __BL.enter(); __BL.sim(7); return " + OBJ + ";})()", lambda r: "keycard" in r),
  ("red keycard", "(()=>{__BL.cp(1); __BL.tp(15.2,-74.8); __BL.sim(0.2); __BL.enter(); __BL.sim(0.5); return " + OBJ + ";})()", lambda r: "maintenance" in r.lower()),
  ("download + reveal", "(()=>{__BL.cp(2); __BL.enemies().filter(e=>e.group==='server').forEach(e=>e.die(null,false,'player')); __BL.tp(20,-131.8); __BL.sim(0.3); __BL.enter(); for(let i=0;i<72;i++){__BL.player.hp=100;__BL.player.alive=true;__BL.tp(20,-131.8);__BL.sim(1);} return " + OBJ + ";})()", lambda r: "ESCAPE" in r),
  ("freight elevator ends chapter", "(()=>{__BL.player.hp=100; __BL.tp(20,-165); __BL.sim(1.5); return __BL.state;})()", lambda r: r == "end"),
  ("fish easter egg", "(()=>{__BL.cp(2); __BL.enemies().forEach(e=>e.die(null,false,'player')); __BL.tp(31.5,-86.5); for(let i=0;i<32;i++){ const p=__BL.player,f=new THREE.Vector3(31.5,1.45,-89.2); p.hp=100; p.yaw=Math.atan2(-(f.x-p.pos.x),-(f.z-p.pos.z)); p.pitch=Math.atan2(f.y-(p.pos.y+p.eye),Math.hypot(f.x-p.pos.x,f.z-p.pos.z)); __BL.sim(1);} __BL.sim(3); __BL.tp(27.3,-86); __BL.sim(0.3); __BL.enter(); return !!__BL.inv().golden;})()", lambda r: r),
 ],
 4: [
  ("guards", "(()=>{__BL.cp(0); __BL.sim(1); __BL.enemies().forEach(e=>e.alive&&!e.isAlly&&!e.isBoss&&e.die(null,false,'player')); __BL.tp(-6,45); __BL.sim(5); return __BL.Mission.cur().id;})()", lambda r: r == "voss"),
  ("talk to Voss", "(()=>{__BL.tp(-50.5,46.5,0.18); __BL.sim(0.3); return __BL.enter();})()", lambda r: r and "Voss" in r),
  ("hold safehouse", "(()=>{for(let i=0;i<140&&!(__BL.Mission.cur().id==='escort');i++){__BL.player.hp=1e6;__BL.player.alive=true;__BL.sim(1);} return __BL.Mission.cur().id;})()", lambda r: r == "escort"),
  ("trap ends flashback", "(()=>{__BL.enemies().forEach(e=>e.alive&&!e.isAlly&&!e.isBoss&&e.die(null,false,'player')); __BL.tp(-118,94.5); for(let i=0;i<90&&!(__BL.state==='end');i++){__BL.player.hp=1e6;__BL.player.alive=true;__BL.sim(1);} return __BL.state;})()", lambda r: r == "end"),
 ],
 5: [
  ("drive + collapse detour", "(()=>{__BL.cp(0); __BL.sim(0.5); const c=__BL.player.inVehicle; c.pos.set(4.5,0,50); __BL.sim(5); c.pos.set(4.5,0,-30); __BL.sim(1); return " + OBJ + ";})()", lambda r: "detour" in r.lower()),
  ("90th avenue", "(()=>{const c=__BL.player.inVehicle; c.pos.set(95,0,-80); __BL.sim(1); return " + OBJ + ";})()", lambda r: "90th" in r),
  ("reach airport", "(()=>{__BL.cp(1); __BL.sim(0.5); __BL.player.inVehicle.pos.set(0,0,-405); __BL.sim(1); return " + OBJ + ";})()", lambda r: "airport" in r.lower()),
  ("board fighter", "(()=>{__BL.cp(2); __BL.player.armor=100; __BL.tp(40,-512); __BL.sim(1); __BL.tp(42,-530); __BL.sim(0.2); __BL.enter(); __BL.sim(0.5); return !!__BL.Flight.jet;})()", lambda r: r),
  ("takeoff ends chapter", "(()=>{__BL.cp(3); __BL.sim(0.5); __BL.keys.KeyW=true; __BL.sim(3); for(let i=0;i<24;i++){ __BL.mouse(0,-6); __BL.sim(1/30); } for(let i=0;i<20&&__BL.state!=='end';i++) __BL.sim(1); return __BL.state;})()", lambda r: r == "end"),
 ],
 6: [
  ("beacons", "(()=>{__BL.cp(0); __BL.sim(1); for(let k=0;k<8&&__BL.Mission.cur().id==='formup';k++){ const m=__BL.Mission.marker(); if(m) __BL.Flight.jet.pos.copy(m); __BL.Flight.jet.hp=100; __BL.sim(0.5);} return __BL.Mission.cur().id;})()", lambda r: r == "dogfight"),
  ("dogfight", "(()=>{for(let k=0;k<20&&__BL.Mission.cur().id==='dogfight';k++){ const f=__BL.fighters().find(f=>!f.dead); if(f) f.damage(500); __BL.Flight.jet.hp=100; __BL.sim(1);} return __BL.Mission.cur().id;})()", lambda r: r == "bombers"),
  ("bombers", "(()=>{for(let k=0;k<30&&__BL.Mission.cur().id==='bombers';k++){ __BL.fighters().filter(f=>!f.dead).forEach(f=>f.damage(2000)); if(__BL.Flight.jet) __BL.Flight.jet.hp=100; __BL.sim(1);} return __BL.Mission.cur().id;})()", lambda r: r == "betrayal"),
  ("betrayal ends chapter", "(()=>{for(let k=0;k<60&&__BL.state!=='end';k++) __BL.sim(1); return __BL.state;})()", lambda r: r == "end"),
 ],
 7: [
  ("unarmed start", "(()=>{__BL.cp(0); __BL.sim(1); return Object.keys(__BL.inv()).join(',');})()", lambda r: r == "fists"),
  ("find weapon", "(()=>{const w=__BL.Mission.marker(); __BL.tp(w.x-1.5,w.z); __BL.sim(0.2); __BL.enter(); __BL.sim(0.5); return " + OBJ + ";})()", lambda r: "compound" in r),
  ("labs + photographs", "(()=>{__BL.cp(1); __BL.enemies().forEach(e=>e.die(null,false,'player')); let m=__BL.Mission.marker(); __BL.tp(m.x-1,m.z+1); __BL.sim(0.3); __BL.enter(); __BL.sim(1); m=__BL.Mission.marker(); __BL.tp(m.x,m.z+0.4); __BL.sim(0.3); __BL.enter(); __BL.sim(12); return " + OBJ + ";})()", lambda r: True),
  ("photographs end chapter", "(()=>{for(let i=0;i<12&&__BL.state!=='end';i++) __BL.sim(1); return __BL.state;})()", lambda r: r == "end"),
 ],
 8: [
  ("beach + path", "(()=>{__BL.cp(0); __BL.sim(1); __BL.tp(20,236); __BL.sim(2); __BL.tp(20,56); __BL.sim(2); return __BL.Mission.cur().id;})()", lambda r: r == "key"),
  ("transmitter key", "(()=>{__BL.enemies().forEach(e=>e.alive&&!e.isAlly&&!e.isBoss&&e.die(null,false,'player')); __BL.tp(48.5,2); __BL.sim(0.3); __BL.enter(); __BL.sim(3); return __BL.Mission.cur().id;})()", lambda r: r == "tower"),
  ("send the warning", "(()=>{__BL.player.hp=1e6;__BL.player.alive=true; __BL.tp(121.5,-146); __BL.sim(0.5); __BL.enter(); __BL.sim(1); return __BL.Mission.cur().id;})()", lambda r: r == "hold"),
  ("transmit", "(()=>{for(let i=0;i<90&&!(__BL.Mission.cur().id==='dock');i++){__BL.player.hp=1e6;__BL.player.alive=true;__BL.sim(1);} return __BL.Mission.cur().id;})()", lambda r: r == "dock"),
  ("dock ends flashback", "(()=>{__BL.enemies().forEach(e=>e.alive&&!e.isAlly&&!e.isBoss&&e.die(null,false,'player')); __BL.tp(345,-10); for(let i=0;i<90&&!(__BL.state==='end');i++){__BL.player.hp=1e6;__BL.player.alive=true;__BL.sim(1);} return __BL.state;})()", lambda r: r == "end"),
 ],
 9: [
  ("cycle chamber", "(()=>{__BL.cp(0); __BL.sim(0.5); __BL.enemies().forEach(e=>e.alive&&!e.isAlly&&!e.isBoss&&e.die(null,false,'player')); const m=__BL.Mission.marker(); __BL.tp(m.x,m.z+0.6); __BL.sim(0.3); __BL.enter(); for(let i=0;i<30&&!(__BL.Mission.cur().id!=='truth');i++){__BL.player.hp=1e6;__BL.player.alive=true;__BL.sim(1);} return " + OBJ + ";})()", lambda r: "radio tower" in r),
  ("hold the tower", "(()=>{const c=__BL.Mission.marker(); __BL.tp(c.x-1.5,c.z+1.5); __BL.sim(0.3); __BL.enter(); __BL.sim(0.5); for(let i=0;i<110&&!(['kade','silas'].includes(__BL.Mission.cur().id));i++){__BL.player.hp=1e6;__BL.player.alive=true;__BL.sim(1);} return __BL.Mission.cur().id;})()", lambda r: r in ("kade", "silas")),
  ("defeat Silas", "(()=>{for(let i=0;i<15&&!(__BL.Mission.cur().id==='silas');i++){__BL.player.hp=1e6;__BL.player.alive=true;__BL.sim(1);} const s=__BL.enemies().find(e=>e.isBoss); for(let i=0;i<40&&!s.defeated;i++){ __BL.player.hp=1e6;__BL.player.alive=true; s.damage(150,null,false,'player'); __BL.sim(0.4);} for(let i=0;i<12&&!(__BL.state==='choice');i++){__BL.player.hp=1e6;__BL.player.alive=true;__BL.sim(1);} return __BL.state;})()", lambda r: r == "choice"),
  ("spare Silas", "(()=>{document.getElementById('ch-a').click(); for(let i=0;i<15&&!(__BL.Mission.cur().id==='boat');i++){__BL.player.hp=1e6;__BL.player.alive=true;__BL.sim(1);} return __BL.Mission.cur().id + ' ' + JSON.parse(localStorage.getItem('blackline_story')||'{}').silas;})()", lambda r: r == "boat spared"),
  ("gunboat + approach choice", "(()=>{__BL.enemies().forEach(e=>e.alive&&!e.isAlly&&!e.isBoss&&e.die(null,false,'player')); __BL.tp(403,-10); __BL.sim(0.3); __BL.enter(); __BL.sim(1); return new Promise(r=>setTimeout(()=>r(__BL.state),2600));})()", lambda r: r == "choice"),
  ("quiet approach", "(()=>{document.getElementById('ch-b').click(); return __BL.state + ' ' + JSON.parse(localStorage.getItem('blackline_story')).approach;})()", lambda r: r == "end quiet"),
 ],
 10: [
  ("quiet start in tunnel", "(()=>{__BL.cp(0); __BL.sim(1); return (__BL.player.inVehicle?'apc':'foot')+' '+__BL.Mission.cur().id;})()", lambda r: r == "foot breach"),
  ("loud start in APC", "(()=>{const s=JSON.parse(localStorage.getItem('blackline_story')||'{}'); s.approach='loud'; localStorage.setItem('blackline_story', JSON.stringify(s)); __BL.cp(0); __BL.sim(1); return __BL.player.inVehicle && __BL.player.inVehicle.kind;})()", lambda r: r == "apc"),
  ("gate + turrets", "(()=>{__BL.player.inVehicle.pos.set(0,0,140); __BL.sim(1); for(const t of __BL.targets()) if(t.hp>800&&t.U&&!t.dead) t.damage(5000); __BL.sim(1); return " + OBJ + ";})()", lambda r: "Breach" in r),
  ("laser tripwire raises alarm", "(()=>{__BL.cp(1); __BL.enemies().forEach(e=>e.die(null,false,'player')); __BL.tp(0,-73); __BL.look(0,0); __BL.keys.KeyW=true; __BL.sim(1.6); __BL.keys.KeyW=false; return document.getElementById('notify').textContent;})()", lambda r: "ALARM" in r),
  ("cores", "(()=>{__BL.cp(2); __BL.sim(0.5); __BL.targets().filter(t=>t.hpMax===1100).forEach(c=>c.damage(5000)); __BL.sim(1); return " + OBJ + ";})()", lambda r: "Maya" in r),
  ("boss phases + defeat", "(()=>{const b=__BL.enemies().find(e=>e.hpMax>2000); for(let i=0;i<60&&!b.defeated;i++){ __BL.player.hp=100; __BL.player.alive=true; if(!b.shielded) b.damage(150,null,false,'player'); else __BL.targets().filter(t=>t.orb&&!t.dead).forEach(t=>t.damage(1000)); __BL.sim(0.4);} for(let i=0;i<34;i++){__BL.player.hp=100; __BL.sim(0.5);} return new Promise(r=>setTimeout(()=>r(__BL.state),2600));})()", lambda r: r == "choice"),
 ],
}

async def run_chapter(p, n):
    b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    page = await b.new_page(viewport={"width": 800, "height": 450}); page.set_default_timeout(240000)
    await page.add_init_script("localStorage.setItem('blackline_settings', JSON.stringify({quality:'low',shadows:false,effects:'low',aa:false,sens:1,fov:78,vol:0.8,music:0.5,invertY:false}))")
    if n == 10: await page.add_init_script("if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');localStorage.setItem('blackline_story', JSON.stringify({approach:'quiet', silas:'spared'}));}")
    page.on("console", lambda m: ERRS.append(f"[ch{n}] {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: ERRS.append(f"[ch{n}] PAGEERROR {e}"))
    await page.goto((ROOT / "dist" / "index.html").as_uri() + f"?m={n}")
    await page.wait_for_function("window.__BL && window.__BL.state==='menu'")
    check(f"ch{n} boots", True)
    try: await page.screenshot(path=str(OUT / f"ch{n}_menu.png"), timeout=90000)
    except Exception: pass
    for label, js, pred in CH[n]:
        try: r = await page.evaluate(js); ok = bool(pred(r))
        except Exception as e: r, ok = "EXC " + str(e)[:200], False
        check(f"ch{n} {label}", ok, r)
    if n == 10:
        await page.evaluate("document.getElementById('ch-a').click()")
        await page.wait_for_timeout(45000)
        check("ch10 PLAYER 2 CONNECTED", await page.evaluate("document.getElementById('final-p2').classList.contains('show')"))
        try: await page.screenshot(path=str(OUT / "ch10_final.png"), timeout=90000)
        except Exception: pass
    await b.close()

async def main():
    only = [int(a) for a in sys.argv[2:]] or list(range(1, 11))
    async with async_playwright() as p:
        for n in only: await run_chapter(p, n)
    print("\n".join(ERRS[:30]) or "NO CONSOLE ERRORS")
    print(f"\n{len(FAIL)} failures, {len(ERRS)} console errors")

asyncio.run(main())
