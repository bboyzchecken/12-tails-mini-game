# Add-on: ตัวละครแรก — หมา + แกะ (asset prep)

ส่วนเสริมของ **PLAN.md** · ทำ `dog` และ `sheep` เป็น 2 entry แรกใน characters.json

> ⚠️ ใช้ต่อได้ตราบที่เป็น fan project ไม่หากิน (ไม่มีเติมเงิน/ของขาย/โฆษณา) + ให้เครดิต Bigbug
> 🟢 อย่าให้ track นี้บล็อก Phase 0 — โค้ดเดินด้วย **placeholder** ไปก่อน (ดูท้ายไฟล์) แล้วค่อย swap ของจริง

---

## เป้าหมาย: ไฟล์ที่ต้องได้ต่อ 1 ตัว (ตรงสเปก PLAN.md)

| ไฟล์ | ขนาด | layout |
|---|---|---|
| `sheet.png` | 320×256 px | grid 5col × 4row เฟรมละ 64×64 · row = down/up/left/right · col0 = idle, col1–4 = walk |
| `faces.png` | 768×96 px | grid 8col × 1row เฟรมละ 96×96 · เรียงตาม emotes ใน characters.json |
| `thumb.png` | ~128×128 px | portrait นิ่ง 1 รูป |

วางที่ `client/public/assets/characters/dog/` และ `.../sheep/`

---

## Track A — Extract (ทำครั้งเดียว)

- [ ] รื้อทั้งโปรเจกต์ด้วย **uTinyRipper** → เปิดใน **Unity** (ตาม tutorial)
- [ ] หา prefab/model ของ **หมา** และ **แกะ** + animation clip (`Idle`, `Walk`) ของแต่ละตัว จดชื่อไฟล์/path ไว้
- [ ] (สำหรับ faces) เปิด **AssetStudio** ไล่ดู `Texture2D` — หน้า emote/portrait ในเกมมักเป็น **2D อยู่แล้ว** (อยู่ใน UI atlas) ถ้าเจอ = ดึงออกมาใช้ตรงๆ ง่ายกว่า render จากโมเดลเยอะ

---

## Track B — Render walk + idle → `sheet.png` (ต่อตัว)

**ตั้ง render scene ใน Unity:**
- [ ] กล้อง **Orthographic**, `Clear Flags = Solid Color`, background alpha = 0 (โปร่ง)
- [ ] มุมกล้อง **3/4 ก้มลง ~35°** (อ่านง่ายกว่า top-down ตรงๆ และได้ฟีล chibi MMO)
- [ ] แสง flat นุ่ม ไม่มีเงาแข็ง (sprite จะได้สะอาด)
- [ ] วางตัวละครกลางเฟรม **เท้าอยู่จุดคงที่** สูงราว 80% ของเฟรม
- [ ] **ใช้กล้อง/ระยะ/ortho size เดียวกันทั้งหมา+แกะ** เพื่อสเกลสัมพันธ์กันถูก

**Render script** (`tools/render-sprites/SpriteFrameRenderer.cs` — Unity Editor):
```csharp
using UnityEngine; using UnityEditor; using System.IO;

public class SpriteFrameRenderer : MonoBehaviour {
    public GameObject target; public Animator animator; public Camera cam;
    public string idleState = "Idle", walkState = "Walk";
    public int walkFrames = 4, size = 64;
    public string outDir = "Assets/_render/dog";
    // ปรับ yaw ให้ facing ที่เห็นตรงกับทิศจริง (verify ด้วยตา)
    readonly string[] dirs = {"down","up","left","right"};
    readonly float[]  yaw  = {0f, 180f, 90f, 270f};

    [ContextMenu("Render All")]
    public void RenderAll() {
        Directory.CreateDirectory(outDir);
        for (int d = 0; d < 4; d++) {
            target.transform.rotation = Quaternion.Euler(0, yaw[d], 0);
            Shot(idleState, 0f, $"{outDir}/{dirs[d]}_idle.png");
            for (int f = 0; f < walkFrames; f++)
                Shot(walkState, (float)f / walkFrames, $"{outDir}/{dirs[d]}_walk{f}.png");
        }
        AssetDatabase.Refresh();
    }
    void Shot(string state, float t, string path) {
        animator.Play(state, 0, t); animator.Update(0f);
        var rt = new RenderTexture(size, size, 24, RenderTextureFormat.ARGB32);
        cam.targetTexture = rt; cam.Render();
        RenderTexture.active = rt;
        var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
        tex.ReadPixels(new Rect(0, 0, size, size), 0, 0); tex.Apply();
        File.WriteAllBytes(path, tex.EncodeToPNG());
        cam.targetTexture = null; RenderTexture.active = null;
    }
}
```

**Pack เป็น grid** (ImageMagick — ลำดับต้องตรง rowOrder: down/up/left/right):
```bash
cd Assets/_render/dog
montage \
  down_idle.png down_walk0.png down_walk1.png down_walk2.png down_walk3.png \
  up_idle.png   up_walk0.png   up_walk1.png   up_walk2.png   up_walk3.png \
  left_idle.png left_walk0.png left_walk1.png left_walk2.png left_walk3.png \
  right_idle.png right_walk0.png right_walk1.png right_walk2.png right_walk3.png \
  -tile 5x4 -geometry 64x64+0+0 -background none sheet.png
```
(หรือใช้ TexturePacker จัด grid เดียวกันก็ได้)

---

## Track C — `faces.png` (8 อารมณ์)

ลำดับต้องตรง `face.emotes` ใน characters.json: `neutral, happy, angry, sad, surprised, laugh, cry, love`

- **ทาง 1 (แนะนำ):** ดึง texture หน้า emote 2D จากเกมตรงๆ ด้วย AssetStudio → resize ให้ 96×96 → montage 8×1
- **ทาง 2:** ถ้าหน้าเป็น 3D rig → render หัวโคลสอัพต่ออารมณ์ (ถ้าโมเดลมี blendshape/pose)
- **ทาง 3 (สำรอง):** ปรับ/วาดสีหน้าจาก neutral เอง
```bash
montage neutral.png happy.png angry.png sad.png surprised.png laugh.png cry.png love.png \
  -tile 8x1 -geometry 96x96+0+0 -background none faces.png
```

---

## Track D — `thumb.png`

- [ ] render/crop portrait นิ่ง 1 รูปต่อตัว ~128×128 พื้นหลังโปร่ง (ใช้มุมหน้าตรงสวยๆ)

---

## Track E — เสียบเข้า characters.json

เพิ่ม 2 entry (frame/face block มีอยู่แล้วจาก PLAN.md):
```json
{
  "characters": [
    {
      "id": "dog", "name": "หมา", "tribe": "<คลาสในเกม>", "color": "#C8A165",
      "sheet": "assets/characters/dog/sheet.png",
      "faces": "assets/characters/dog/faces.png",
      "thumb": "assets/characters/dog/thumb.png"
    },
    {
      "id": "sheep", "name": "แกะ", "tribe": "<คลาสในเกม>", "color": "#E8E4DA",
      "sheet": "assets/characters/sheep/sheet.png",
      "faces": "assets/characters/sheep/faces.png",
      "thumb": "assets/characters/sheep/thumb.png"
    }
  ]
}
```

---

## Checklist "ตัวนี้เสร็จ พร้อมเสียบ" (ต่อ 1 ตัว)

- [ ] `sheet.png` = 320×256, ทุกเฟรมตรง grid 64px, พื้นหลังโปร่ง
- [ ] ครบ 4 ทิศ + มี idle ทุกทิศ + เท้าอยู่จุดเดียวกันทุกเฟรม (เดินไม่กระตุก)
- [ ] สเกลตรงกับอีกตัว (หมา/แกะ สัดส่วนสมเหตุผลกับ tile 32px)
- [ ] `faces.png` = 768×96, ครบ 8 อารมณ์ เรียงถูกลำดับ
- [ ] `thumb.png` มี, พื้นหลังโปร่ง
- [ ] entry ใน characters.json ครบ path ถูก
- [ ] เข้าเกมจริง: โผล่ในหน้าเลือกตัว + spawn + เดิน anim ถูกทุกทิศ

---

## Placeholder fallback (เพื่อไม่บล็อก Phase 0–2)

- [ ] ทำ `sheet.png` placeholder grid 5×4 (64px) จาก Kenney (CC0) หรือสี่เหลี่ยม 4 สีบอกทิศ
- [ ] `faces.png` placeholder 8×1 + `thumb.png` สี่เหลี่ยม
- [ ] ใส่ id `dog`/`sheep` ชี้ placeholder ก่อน → พอ sprite จริงเสร็จค่อยเปลี่ยน path ไฟล์ทับ (โค้ดไม่ต้องแก้)
