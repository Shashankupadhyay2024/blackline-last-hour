"""Quick scenario runner: python3 tests/quick.py <mission> "<js expression list separated by ;;>" [shot.png]
Each JS chunk is evaluated in order; results printed. Console errors reported."""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
async def main():
    m = sys.argv[1]; chunks = [c.strip() for c in sys.argv[2].split(';;') if c.strip()] if len(sys.argv) > 2 else []
    shots = sys.argv[3] if len(sys.argv) > 3 else None
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        page = await b.new_page(viewport={"width": 800, "height": 450}); page.set_default_timeout(180000)
        await page.add_init_script("localStorage.setItem('blackline_settings', JSON.stringify({quality:(new URLSearchParams(location.search).get('q')||'low'),shadows:true,effects:'high',aa:false,sens:1,fov:78,vol:0.8,music:0.5,invertY:false})); localStorage.setItem('blackline_unlocked','5'); window.__pad={axes:[0,0,0,0],btn:new Array(17).fill(0)}; navigator.getGamepads=()=>[window.__pad.on?{id:'Xbox Wireless Controller (STANDARD GAMEPAD)',connected:true,mapping:'standard',axes:window.__pad.axes,buttons:window.__pad.btn.map(v=>({pressed:v>0.5,value:v})),vibrationActuator:{playEffect(){return Promise.resolve()}}}:null];")
        page.on("console", lambda msg: errs.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))
        import os
        await page.goto((ROOT / "dist" / "index.html").as_uri() + f"?m={m}&q=" + os.environ.get("Q", "low"))
        await page.wait_for_function("window.__BL && (window.__BL.state==='menu')")
        for i, c in enumerate(chunks):
            if c.startswith('SHOT'):
                name = c.split()[1]
                try: await page.screenshot(path=name, timeout=90000)
                except Exception as e: print('shot failed', e)
                continue
            try: r = await page.evaluate(c)
            except Exception as e: r = 'EXC ' + str(e)[:300]
            print(f"[{i}]", str(r)[:600])
        await b.close()
    print("ERRORS:", len(errs)); [print("  ", e[:400]) for e in errs[:15]]
asyncio.run(main())
