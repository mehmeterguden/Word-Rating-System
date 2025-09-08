# Pixabay API Setup

Study Mode'da daha fazla resim için Pixabay API key'ini ayarlamanız gerekiyor.

## Adımlar:

1. **Pixabay hesabı oluşturun:**
   - https://pixabay.com/accounts/register/ adresine gidin
   - Hesabınızı oluşturun

2. **API key alın:**
   - https://pixabay.com/api/docs/ adresine gidin
   - "Get API Key" butonuna tıklayın
   - API key'inizi kopyalayın

3. **API key'ini ayarlayın:**
   - `src/utils/imageApi.ts` dosyasını açın
   - `YOUR_PIXABAY_ACCESS_KEY` yerine aldığınız key'i yapıştırın:
   ```typescript
   const PIXABAY_ACCESS_KEY = 'your_actual_pixabay_key_here';
   ```

## Hibrit Sistem Özellikleri:

### ✅ **Akıllı Sıralama:**
1. **Unsplash** (50 resim/gün) - Yüksek kalite
2. **Pixabay** (5,000 resim/gün) - Geniş seçenek
3. **Cache** - Daha önce yüklenen resimler

### ✅ **Limit Takibi:**
- Gerçek zamanlı limit gösterimi
- Modal'da günlük limitler görünür
- Otomatik reset (her gün)

### ✅ **Caching Sistemi:**
- Aynı kelimeyi tekrar aramaz
- 7 gün boyunca saklanır
- Hızlı yükleme

## Toplam Limit:

- **Unsplash**: 50 resim/gün
- **Pixabay**: 5,000 resim/gün
- **Toplam**: ~5,050 resim/gün

## Test:

API key'ini ayarladıktan sonra Study Mode'da resim ikonuna tıklayın. Modal'ın altında limit'leri görebilirsiniz!
