"""One-off: generate Sip 'n' Dine dish/venue photos with Gemini Nano Banana and push them to object storage.
Writes generated_images.json ({key: storage_path}) which seed.py reads. Safe to re-run; skips keys already done."""
import asyncio
import base64
import io
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from PIL import Image

from storage import APP_NAME, put_object

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")
OUT = ROOT / "generated_images.json"

STYLE = "Professional food photography, warm low-key lighting, dark walnut table, brass and copper accents, shallow depth of field, editorial Indian fine-dining restaurant, no text, no watermark, square 1:1."
PROMPTS = {
    "venue-dining-room": "Elegant Indian fine-dining restaurant interior at dusk in Chandigarh: warm brown walls, golden pendant lights, a lush floral feature wall, linen-set tables, intimate ambience. Interior photography, no people, no text.",
    "venue-private-nook": "Cosy private dining nook with a floral wall backdrop, round table set for eight with gold cutlery and candles, warm brown and gold palette. Interior photography, no text.",
    "venue-banquet": "Spacious banquet hall decorated for an Indian celebration: long tables with cream linens, marigold and rose florals, warm golden uplighting, chandeliers, brown and gold palette. No people, no text.",
    "buffet-spread": f"Lavish Indian lunch buffet spread in copper chafing dishes: biryani, dal makhani, paneer, kebabs, naan basket, salads and desserts along a long counter. {STYLE}",
    "dal-makhani": f"Dal makhani, slow-cooked black lentils with a swirl of cream and a pat of butter, in a copper handi, with garlic naan beside. {STYLE}",
    "butter-chicken": f"Butter chicken, glossy tomato-cream curry with tender chicken, garnished with cream swirl and coriander, in a brass bowl, with naan. {STYLE}",
    "galouti-kebab": f"Awadhi galouti kebabs, melt-in-the-mouth minced mutton patties on tiny ulte tawa parathas, with mint chutney and onion rings. {STYLE}",
    "mutton-biryani": f"Lucknowi mutton biryani in a sealed handi with the dough crust just opened, saffron rice, fried onions, mint, served with raita. {STYLE}",
    "paneer-tikka": f"Tandoori paneer tikka, charred cottage cheese cubes with peppers and onions on a sizzling plate, mint chutney. {STYLE}",
    "rogan-josh": f"Kashmiri mutton rogan josh, deep red aromatic curry in a copper bowl with steamed rice and a sprig of coriander. {STYLE}",
    "tandoori-platter": f"Mixed tandoori platter: tandoori chicken, seekh kebab, malai tikka, fish tikka on a sizzler with lemon wedges and salad. {STYLE}",
    "chilli-cauliflower": f"Indo-Chinese chilli cauliflower, crisp gobi tossed in glossy chilli-garlic sauce with spring onions, in a black ceramic bowl. {STYLE}",
    "amritsari-kulcha": f"Amritsari kulcha, blistered stuffed bread with butter melting, served with chole and pickled onions. {STYLE}",
    "moong-dal-halwa": f"Moong dal halwa, golden ghee-rich dessert topped with slivered almonds and pistachios, silver leaf, in a small brass bowl. {STYLE}",
    "badam-shorba": f"Badam shorba, creamy almond soup in a white bowl with slivered almonds and saffron strands, on a dark table. {STYLE}",
    "masala-old-fashioned": f"Signature cocktail: a smoky whisky old fashioned with a cinnamon stick and orange peel, large clear ice, in a cut-crystal glass on a dark bar. {STYLE}",
    "saffron-gin-tonic": f"Saffron gin and tonic in a balloon glass with a cardamom pod and rose petals, back-lit at a brown and gold bar. {STYLE}",
    "masala-mojito": f"Masala mojito mocktail with mint, lime, chaat masala rim, crushed ice, tall glass at a warm bar counter. {STYLE}",
}


async def generate(key: str, prompt: str) -> str:
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"sipndine-img-{key}", system_message="You are a food photographer.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    _, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if not images:
        raise RuntimeError(f"no image for {key}")
    raw = base64.b64decode(images[0]["data"])
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    img.thumbnail((1024, 1024))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=82, optimize=True)
    path = f"{APP_NAME}/seed/{key}.jpg"
    put_object(path, buf.getvalue(), "image/jpeg")
    return path


async def main():
    done = json.loads(OUT.read_text()) if OUT.exists() else {}
    for key, prompt in PROMPTS.items():
        if key in done:
            continue
        try:
            done[key] = await generate(key, prompt)
            print("ok", key, flush=True)
        except Exception as exc:  # keep going; seed falls back to no image
            print("fail", key, str(exc)[:120], flush=True)
        OUT.write_text(json.dumps(done, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
