/**
 * "Daha Fazla" hub'ının kategori listesi — tek kaynak. Hem /more
 * sayfası hem BottomNav'ın hover önizleme paneli aynı bu listeyi
 * kullanır, ikisi ayrı ayrı tanımlanıp zamanla birbirinden
 * uzaklaşmasın diye (bu projede daha önce bu tür kopya-sürüklenmesi
 * kaynaklı hatalar yaşadık).
 */
export const MORE_CATEGORIES = [
  { href: '/reminders', label: 'Hatırlatıcılar', desc: 'Gecikmiş ve yaklaşan son tarihli kayıtlar' },
  { href: '/library-overview', label: 'Kütüphane Detayı', desc: 'Okunan/okunmayan, dağılımlar, okuma süresi hesaplayıcı' },
  { href: '/borrowed-books', label: 'Ödünç Aldıklarım', desc: 'Başkalarından ödünç aldığınız kitaplar' },
  { href: '/gifts', label: 'Hediyeler', desc: 'Hediye ettiğiniz kitapları görün' },
  { href: '/reading/stats', label: 'İstatistikler', desc: 'Toplam sayfa, tempo, aylık dağılım' },
  { href: '/manage', label: 'Yönet', desc: 'Yazar, yayınevi, konum, etiket, kişi kayıtları' },
];
