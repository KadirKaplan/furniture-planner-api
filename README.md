# 🛋️ Furniture Configurator API

Node.js + MongoDB REST API — Mobilya Konfiguratör Backend

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- MongoDB 6+ (lokal veya Atlas)

### Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. .env dosyasını oluştur
cp .env.example .env
# MONGODB_URI'yi düzenle

# 3. Örnek veriyi yükle
npm run seed

# 4. Başlat
npm run dev   # geliştirme (nodemon)
npm start     # production
```

### Docker ile (önerilen)

```bash
docker-compose up -d
npm run seed   # seed'i bir kere çalıştır
```

---

## 📡 API Endpoints

Base URL: `http://localhost:3001/api`

---

### Kategoriler

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/categories` | Tüm kategorileri listele |
| GET | `/categories/:slug` | Slug ile kategori getir |
| POST | `/categories` | Yeni kategori oluştur |
| PUT | `/categories/:id` | Kategori güncelle |
| DELETE | `/categories/:id` | Kategori sil (soft) |

---

### Malzemeler

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/materials` | Tüm malzemeleri listele |
| GET | `/materials?type=wood` | Tipe göre filtrele (`wood`, `fabric`, `leather`, `metal`, `glass`) |
| GET | `/materials/:slug` | Slug ile malzeme getir (renkleriyle birlikte) |
| POST | `/materials` | Yeni malzeme oluştur |
| PUT | `/materials/:id` | Malzeme güncelle |
| DELETE | `/materials/:id` | Malzeme sil (soft) |

---

### Ürünler

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/products` | Tüm ürünleri listele |
| GET | `/products?category=ID&featured=true&minPrice=5000&maxPrice=20000&page=1&limit=10` | Filtreli listeleme |
| GET | `/products/:slug` | Ürün detayı (malzeme + renkler dahil) |
| POST | `/products/:slug/calculate-price` | Seçime göre fiyat hesapla |
| POST | `/products` | Yeni ürün oluştur |
| PUT | `/products/:id` | Ürün güncelle |
| DELETE | `/products/:id` | Ürün sil (soft) |

---

### Fiyat Hesaplama

`POST /api/products/:slug/calculate-price`

```json
{
  "variantId": "mongo_variant_id",
  "materialId": "mongo_material_id",
  "colorName": "Kadife Yeşil"
}
```

**Cevap:**
```json
{
  "success": true,
  "data": {
    "basePrice": 18500,
    "totalPrice": 24000,
    "currency": "TRY",
    "breakdown": [
      { "label": "Baz fiyat", "amount": 18500 },
      { "label": "Varyant (2+3 - 5 modül)", "amount": 4500 },
      { "label": "Malzeme (Kadife Kumaş)", "amount": 800 },
      { "label": "Renk (Altın Sarısı)", "amount": 200 }
    ]
  }
}
```

---

## 🗂️ Veri Modelleri

### Product
```
name, slug, description
category (ref)
basePrice, currency
variants: [{ name, priceModifier, dimensions, basePrice, isAvailable }]
allowedMaterials: [Material ref]
images, thumbnail, tags
isActive, isFeatured, stock
```

### Material
```
name, slug, type (wood/fabric/leather/metal/glass)
priceModifier (malzeme baz farkı)
colors: [{ name, hex, texture, priceModifier, isAvailable }]
thumbnail, isActive
```

### Category
```
name, slug, icon, description, order, isActive
```

---

## 🌐 Frontend Entegrasyonu

```js
// Tüm ürünleri çek
const res = await fetch('http://localhost:3001/api/products');
const { data } = await res.json();

// Belirli ürünü al
const res = await fetch('http://localhost:3001/api/products/moduler-kose-koltuk');
const { data: product } = await res.json();
// product.allowedMaterials renk bilgisiyle birlikte gelir

// Fiyat hesapla
const price = await fetch('/api/products/moduler-kose-koltuk/calculate-price', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ variantId, materialId, colorName })
});
```
