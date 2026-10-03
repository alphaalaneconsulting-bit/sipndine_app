"""Editable launch content. Runs once (when `settings` is empty); everything is then owned by the admin panel."""
import json

from core import ROOT_DIR, db, now_iso

IMAGES_FILE = ROOT_DIR / "generated_images.json"


def img(key: str) -> str:
    images = json.loads(IMAGES_FILE.read_text()) if IMAGES_FILE.exists() else {}
    return images.get(key, "")


SETTINGS = {
    "settings_id": "main",
    "brand_name": "Sip 'n' Dine",
    "tagline": "Indian Fine Dining",
    "hero_eyebrow": "SIP 'N' DINE · SECTOR 7-C, CHANDIGARH",
    "hero_title": "An unhurried table, made for you.",
    "hero_caption": "Awadhi & Punjabi classics, slow-cooked dal, overnight-rested biryani — two decades on Madhya Marg.",
    "hero_image": img("venue-dining-room"),
    "book_title": "Book a table",
    "book_caption": "Lunch 12–4 · Dinner 7–11:30 · We confirm on WhatsApp within the hour.",
    "promo_eyebrow": "THIS WEEK AT THE HOUSE",
    "promo_title": "Sunday slow brunch · 20% off for members",
    "promo_caption": "Every Sunday · 12:30–4 PM · Buffet with live kebab counter",
    "promo_image": img("buffet-spread"),
    "favourites_title": "Favourites & recommendations",
    "favourites_caption": "The plates our regulars never skip.",
    "new_title": "New additions",
    "new_caption": "Fresh from the kitchen and the bar this season.",
    "phone": "+911724641656",
    "whatsapp": "911724641656",
    "email": "info@sipndine.com",
    "address": "SCO 16-A, Madhya Marg, Sector 7-C, Chandigarh 160019",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=Sip+n+Dine+SCO+16-A+Madhya+Marg+Sector+7-C+Chandigarh",
    "hours": "Open daily · 11:00 AM – 11:30 PM",
    "whatsapp_greeting": "Hello Sip 'n' Dine! I'd like to ",
    "about_title": "A family table that grew into a neighbourhood.",
    "about_body": "Two decades on Madhya Marg. Recipes older than the room. Dal simmered for a full day, biryanis rested overnight, and a wall sign that reads — Owners also eat here.\n\nSip 'n' Dine serves Awadhi and Punjabi classics alongside a thoughtful bar, with a floral-wall private nook for intimate dinners and a banquet floor for celebrations from 20 to 200 guests.",
    "discount_terms": "Privileges are personal to the member, redeemed once per visit with a live 60-second code shown to your host. Not valid with other offers.",
    "takeaway_note": "Members save 10% on takeaway. Send your order on WhatsApp and we'll confirm a pickup time.",
    "updated_at": now_iso(),
}

MENU = [
    # (item_id, name, description, price, category, image, favourite, new, veg)
    ("galouti-kebab", "Galouti kebab", "Awadhi melt-in-the-mouth mutton kebabs on ulte tawa parathas, mint chutney.", "₹595", "Starters", "galouti-kebab", True, False, False),
    ("paneer-tikka", "Tandoori paneer tikka", "Charred cottage cheese, peppers and onions off the sizzler.", "₹445", "Starters", "paneer-tikka", True, False, True),
    ("tandoori-platter", "Mixed tandoori platter", "Tandoori chicken, seekh, malai tikka and fish tikka for the table.", "₹1,195", "Starters", "tandoori-platter", False, False, False),
    ("chilli-cauliflower", "Chilli cauliflower", "Crisp gobi tossed in chilli-garlic glaze — our Indo-Chinese favourite.", "₹395", "Starters", "chilli-cauliflower", True, False, True),
    ("badam-shorba", "Badam shorba", "Silky almond soup with saffron — a gentle start.", "₹295", "Starters", "badam-shorba", False, True, True),
    ("dal-makhani", "Dal makhani", "Black lentils simmered for a full day, finished with butter and cream.", "₹425", "Mains", "dal-makhani", True, False, True),
    ("butter-chicken", "Butter chicken", "The classic — tender tandoori chicken in a glossy tomato-cream gravy.", "₹545", "Mains", "butter-chicken", True, False, False),
    ("rogan-josh", "Mutton rogan josh", "Kashmiri slow-braised mutton in an aromatic red gravy.", "₹645", "Mains", "rogan-josh", False, False, False),
    ("mutton-biryani", "Lucknowi mutton biryani", "Rested overnight, sealed in dough and opened at your table. Served with raita.", "₹695", "Mains", "mutton-biryani", True, False, False),
    ("amritsari-kulcha", "Amritsari kulcha & chole", "Blistered stuffed kulcha, butter, chole and pickled onions.", "₹325", "Breads & Rice", "amritsari-kulcha", False, True, True),
    ("moong-dal-halwa", "Moong dal halwa", "Ghee-rich, slow-stirred, finished with almonds, pistachio and silver leaf.", "₹295", "Desserts", "moong-dal-halwa", True, False, True),
    ("masala-old-fashioned", "Masala old fashioned", "Smoky whisky, cinnamon, orange peel, large clear ice.", "₹595", "Bar", "masala-old-fashioned", True, True, True),
    ("saffron-gin-tonic", "Saffron gin & tonic", "Gin, saffron, cardamom and rose over tonic.", "₹545", "Bar", "saffron-gin-tonic", False, True, True),
    ("masala-mojito", "Masala mojito (zero-proof)", "Mint, lime, chaat-masala rim and crushed ice.", "₹295", "Bar", "masala-mojito", False, True, True),
]

OFFERS = [
    {"offer_id": "buffet-sunday", "kind": "Buffet", "title": "Sunday slow brunch", "subtitle": "The full buffet with a live kebab counter and desserts.", "discount": "20% off", "validity": "Every Sunday · 12:30–4 PM", "image": img("buffet-spread"), "max_per_day": 1, "terms": "One redemption per member per visit. Billing at the table.", "is_active": True, "sort_order": 1},
    {"offer_id": "combo-date-night", "kind": "Combo", "title": "Table for two", "subtitle": "Two starters, two mains, breads, a dessert and two cocktails.", "discount": "₹2,499", "validity": "Dinner · Monday to Thursday", "image": img("venue-private-nook"), "max_per_day": 1, "terms": "Advance reservation recommended.", "is_active": True, "sort_order": 2},
    {"offer_id": "inhouse-member", "kind": "In-house", "title": "Member dining privilege", "subtitle": "Your tier discount on the à la carte bill, verified at the table.", "discount": "10–30% off", "validity": "Based on your tier", "image": img("venue-dining-room"), "max_per_day": 1, "terms": "Not valid on buffet, combos or festival menus.", "is_active": True, "sort_order": 3},
    {"offer_id": "takeaway-member", "kind": "Takeaway", "title": "Takeaway saver", "subtitle": "Order ahead on WhatsApp and save on pickup.", "discount": "10% off", "validity": "Daily · 12–11 PM", "image": img("butter-chicken"), "max_per_day": 1, "terms": "Show the code at pickup.", "is_active": True, "sort_order": 4},
]

GALLERY = [
    {"gallery_id": "gallery-dining-room", "eyebrow": "The dining room", "title": "Warm light, linen and the floral wall", "caption": "Evenings at Madhya Marg", "image": img("venue-dining-room"), "sort_order": 1},
    {"gallery_id": "gallery-nook", "eyebrow": "Private dining", "title": "The floral-wall nook", "caption": "Seats 8–12 · Reserve ahead", "image": img("venue-private-nook"), "sort_order": 2},
    {"gallery_id": "gallery-banquet", "eyebrow": "Banqueting", "title": "Celebrations from 20 to 200", "caption": "Weddings, receptions, corporate", "image": img("venue-banquet"), "sort_order": 3},
    {"gallery_id": "gallery-buffet", "eyebrow": "Sunday buffet", "title": "The slow brunch spread", "caption": "Live kebab counter · 12:30–4 PM", "image": img("buffet-spread"), "sort_order": 4},
    {"gallery_id": "gallery-biryani", "eyebrow": "From the kitchen", "title": "Biryani, opened at your table", "caption": "Rested overnight, sealed in dough", "image": img("mutton-biryani"), "sort_order": 5},
    {"gallery_id": "gallery-bar", "eyebrow": "The bar", "title": "Saffron, smoke and citrus", "caption": "Signature cocktails nightly", "image": img("masala-old-fashioned"), "sort_order": 6},
]

MANAGERS = [
    {"manager_id": "manager-banquet", "name": "Rhea Kapoor", "role": "Banqueting & private dining", "status": "Available today", "status_color": "success", "specialty": "Celebrations from 20 to 200 guests", "phone": "+911724641656", "whatsapp": "911724641656"},
    {"manager_id": "manager-corporate", "name": "Kabir Sethi", "role": "Corporate dining & catering", "status": "Replies within 2 hours", "status_color": "info", "specialty": "Team lunches, launches and off-site catering", "phone": "+911724641656", "whatsapp": "911724641656"},
]

NOTIFICATIONS = [
    {"notification_id": "notify-diwali", "eyebrow": "Festival note", "title": "A luminous Diwali to you", "body": "Join us for a festive evening of shared plates and warm pours. Members get first choice of tables.", "date_label": "18 Oct", "is_read": False},
    {"notification_id": "notify-sunday", "eyebrow": "This Sunday", "title": "Slow brunch is back", "body": "The buffet returns with a live kebab counter. 20% off for members with a live code.", "date_label": "This week", "is_read": False},
]


async def seed_content() -> None:
    if await db.settings.count_documents({"settings_id": "main"}):
        return
    await db.settings.insert_one(dict(SETTINGS))
    await db.menu_items.delete_many({})
    await db.menu_items.insert_many([
        {"item_id": i, "name": n, "description": d, "price": p, "category": c, "image": img(k), "is_favourite": f, "is_new": nw, "is_veg": v, "is_available": True, "sort_order": idx}
        for idx, (i, n, d, p, c, k, f, nw, v) in enumerate(MENU)
    ])
    await db.offers.delete_many({})
    await db.offers.insert_many([dict(o) for o in OFFERS])
    await db.gallery.delete_many({})
    await db.gallery.insert_many([dict(g) for g in GALLERY])
    await db.managers.delete_many({})
    await db.managers.insert_many([dict(m) for m in MANAGERS])
    await db.notifications.delete_many({})
    await db.notifications.insert_many([dict(n) for n in NOTIFICATIONS])
