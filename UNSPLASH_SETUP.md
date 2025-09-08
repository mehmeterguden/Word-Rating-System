# Unsplash API Setup

Study Mode'da kelime resimlerini göstermek için Unsplash API key'ini ayarlamanız gerekiyor.

## Adımlar:

1. **Unsplash Developer hesabı oluşturun:**
   - https://unsplash.com/developers adresine gidin
   - "Register as a developer" butonuna tıklayın
   - Hesabınızı oluşturun

2. **Yeni uygulama oluşturun:**
   - "Your apps" sekmesine gidin
   - "New Application" butonuna tıklayın
   - Uygulama adını girin (örn: "Word Study App")
   - "Accept the API Use and Access Policy" kutucuğunu işaretleyin
   - "Create application" butonuna tıklayın

3. **Access Key'i alın:**
   - Uygulama sayfasında "Access Key" bölümünü bulun
   - Key'i kopyalayın

4. **API key'ini ayarlayın:**
   - `src/utils/imageApi.ts` dosyasını açın
   - `YOUR_UNSPLASH_ACCESS_KEY` yerine aldığınız key'i yapıştırın:
   ```typescript
   const UNSPLASH_ACCESS_KEY = 'your_actual_access_key_here';
   ```

## Özellikler:

- ✅ **Otomatik resim arama**: Her kelime için Unsplash'ta resim arar
- ✅ **Akıllı arama**: Soyut kelimeler için özel arama terimleri
- ✅ **Caching**: Resimler localStorage'da saklanır (7 gün)
- ✅ **Loading states**: Resim yüklenirken spinner gösterir
- ✅ **Error handling**: Resim bulunamazsa güzel hata mesajı
- ✅ **Responsive modal**: Resimler güzel modal'da gösterilir

## Limitler:

- **Ücretsiz plan**: 50 resim/gün
- **Ücretli plan**: 5000 resim/gün ($9/ay)

## Test:

API key'ini ayarladıktan sonra Study Mode'a gidin ve herhangi bir kelimenin yanındaki resim ikonuna tıklayın!
