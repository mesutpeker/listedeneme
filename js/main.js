// PDF.js kütüphanesinin yüklendiğini kontrol et
if (typeof pdfjsLib === 'undefined') {
    console.error('PDF.js kütüphanesi yüklenemedi. Sayfa yenilenerek tekrar denenecek...');
    alert('PDF işleme kütüphanesi yüklenemedi. Sayfa yenileniyor...');
    // 3 saniye sonra sayfayı yenile
    setTimeout(() => {
        window.location.reload();
    }, 3000);
} else {
    console.log('PDF.js kütüphanesi başarıyla yüklendi!');
}

// PDF.js çalışma ortamını yapılandırma
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js';

// Ayrık harfleri birleştirme fonksiyonu
function mergeLetters(text) {
    if (!text) return text;
    
    // Örnek: "M U H A M M E D" -> "MUHAMMED"
    // Tek harfli kelimeleri (aralarında boşluk olan harfleri) tespit et ve birleştir
    const words = text.split(' ');
    
    // Eğer çoğunlukla tek harfli kelimeler varsa, tüm harfleri birleştir
    const singleLetterWords = words.filter(word => word.length === 1);
    const mostlySingleLetters = singleLetterWords.length > (words.length / 2);
    
    if (mostlySingleLetters) {
        return words.join('');
    } else if (words.length >= 3) {
        // Daha akıllı analiz - tekrarlanan desen var mı?
        // Örnek: "A R İ F" -> "ARİF"
        let allSingleLettersGroups = true;
        const groups = [];
        let currentGroup = [words[0]];
        
        for (let i = 1; i < words.length; i++) {
            const prevWord = words[i-1];
            const currentWord = words[i];
            
            // Tek harfli kelime dizisi kontrolü
            if (prevWord.length === 1 && currentWord.length === 1) {
                currentGroup.push(currentWord);
            } else if (prevWord.length === 1 && currentWord.length > 1) {
                // Grup bitti
                if (currentGroup.length > 1) {
                    groups.push(currentGroup);
                }
                currentGroup = [currentWord];
                allSingleLettersGroups = false;
            } else {
                // Tek harfli değilse normal kelime
                if (currentGroup.length > 0) {
                    groups.push(currentGroup);
                }
                currentGroup = [currentWord];
                allSingleLettersGroups = false;
            }
        }
        
        // Son grubu da ekle
        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }
        
        // Eğer tüm kelimeler tek harfli gruplardan oluşuyorsa birleştir
        if (allSingleLettersGroups && groups.length > 0 && groups[0].length > 2) {
            return words.join('');
        }
        
        // Tek harfli grupları birleştir, diğer kelimeleri normal bırak
        let result = '';
        for (const group of groups) {
            if (group.length > 2 && group.every(word => word.length === 1)) {
                result += group.join('') + ' ';
            } else {
                result += group.join(' ') + ' ';
            }
        }
        
        return result.trim();
    }
    
    // Değilse, normal kelime olarak kabul et
    return text;
}

// Genel değişkenler
let classesByName = {};
let currentScheduleClass = null;
let debugInfo;
let debugMode;

document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('pdf-file');
    const loadingElem = document.getElementById('loading');
    const uploadTextElem = document.getElementById('upload-text');
    const resultsContainer = document.getElementById('results-container');
    const noResults = document.getElementById('no-results');
    const errorMessage = document.getElementById('error-message');
    debugInfo = document.getElementById('debug-info');
    
    // Geliştirme modunda hata ayıklama bilgilerini göster (URL'de ?debug=true parametresi varsa)
    const urlParams = new URLSearchParams(window.location.search);
    debugMode = urlParams.get('debug') === 'true';
    
    if (debugMode) {
        debugInfo.style.display = 'block';
        debugLog('Debug modu aktif');
    }
    
    // Bootstrap kontrolü
    if (typeof bootstrap !== 'undefined') {
        console.log('Bootstrap yüklendi:', bootstrap.Modal ? 'Modal API mevcut' : 'Modal API eksik');
    } else {
        console.warn('Bootstrap yüklenemedi!');
        // Yüklemeyi dene
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js';
        document.body.appendChild(script);
    }
    
    // Oluştur ve yazdır butonları için event listenerlari
    document.getElementById('generateScheduleBtn').addEventListener('click', function() {
        console.log('Oluştur butonuna tıklandı (global handler)');
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        
        if (!startDate || !endDate || startDate > endDate) {
            alert('Lütfen geçerli bir tarih aralığı seçin.');
            return;
        }
        
        generateHomeworkSchedule(startDate, endDate);
    });
    
    // Çizelge türü seçimi için event listener
    document.getElementById('weeklySchedule').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('daySelectionArea').style.display = 'none';
        }
    });
    
    document.getElementById('dailySchedule').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('daySelectionArea').style.display = 'block';
        }
    });
    
    // Yazdır butonuna tıklanınca
    document.getElementById('printScheduleBtn').addEventListener('click', function() {
        console.log('Yazdır butonu tıklandı');
        
        // Tarihleri al
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            alert('Lütfen başlangıç ve bitiş tarihlerini seçin.');
            return;
        }
        
        // Direkt yazdırma için yeni bir çizelge oluştur
        const printSection = generateHomeworkSchedule(new Date(startDate), new Date(endDate), true);
        
        // Yazdırma işlemini başlat
        setTimeout(() => {
            console.log('Yazdırma başlatılıyor, yazdırma alanı:', printSection);
            
            if (!printSection || printSection.style.display !== 'block') {
                console.error('Yazdırma alanı bulunamadı veya görünür değil!');
                return;
            }
            
            // Satır ve sütun sayısını logla
            const rows = printSection.querySelectorAll('tbody tr').length;
            const cols = printSection.querySelectorAll('th').length;
            console.log(`Yazdırma tablosu: ${rows} satır, ${cols} sütun`);
            
            // Yazdırma CSS'inin çalıştığını doğrula
            const printStyle = window.getComputedStyle(printSection);
            console.log('Yazdırma alanı görünürlüğü:', printStyle.display, printStyle.visibility);
            
            // Öğrenci isimlerinin tek satırda görünmesi için son kontrol
            const studentNameCells = printSection.querySelectorAll('td:first-child');
            studentNameCells.forEach(cell => {
                cell.style.whiteSpace = 'nowrap';
                cell.style.overflow = 'hidden';
                cell.style.textOverflow = 'ellipsis';
                cell.style.lineHeight = '1.1';
                
                // Eğer isim çok uzunsa font boyutunu küçült
                if (cell.textContent.length > 40) {
                    cell.style.fontSize = '8px';
                } else if (cell.textContent.length > 25) {
                    cell.style.fontSize = '9px';
                }
            });
            
            // Tablo genişliğini kontrol et ve boş sütunları kaldır
            const table = printSection.querySelector('table');
            if (table) {
                table.style.width = '100%';
                table.style.tableLayout = 'fixed';
                table.style.borderSpacing = '0';
                table.style.emptyCells = 'show';
                
                // Tüm sütun genişliklerini kontrol et
                const headerCells = table.querySelectorAll('thead th');
                const columnCount = headerCells.length;
                
                // İlk sütun için genişlik (öğrenci adı sütunu)
                if (headerCells[0]) {
                    headerCells[0].style.width = '35%';
                    headerCells[0].style.maxWidth = '35%';
                    headerCells[0].style.minWidth = '35%';
                }
                
                // Diğer sütunlar için eşit genişlik
                const otherColumnWidth = (65 / (columnCount - 1)).toFixed(2);
                for (let i = 1; i < columnCount; i++) {
                    if (headerCells[i]) {
                        headerCells[i].style.width = `${otherColumnWidth}%`;
                        headerCells[i].style.maxWidth = `${otherColumnWidth}%`;
                        headerCells[i].style.minWidth = `${otherColumnWidth}%`;
                        headerCells[i].style.verticalAlign = 'bottom';
                        headerCells[i].style.padding = '2px 0';
                        
                        // Yatay başlıkları düzelt (artık div yok, doğrudan th)
                        headerCells[i].style.fontSize = '10px';
                        headerCells[i].style.fontWeight = 'bold';
                        headerCells[i].style.whiteSpace = 'normal';
                        headerCells[i].style.wordWrap = 'break-word';
                        headerCells[i].style.minHeight = '40px';
                        headerCells[i].style.lineHeight = '1.2';
                    }
                }
                
                // Tüm satırların ve hücrelerin stil kontrolü
                table.querySelectorAll('tr').forEach(row => {
                    row.style.display = 'table-row';
                    row.style.width = '100%';
                    
                    // Bu satırdaki tüm hücreleri kontrol et
                    const cells = row.querySelectorAll('td');
                    cells.forEach((cell, index) => {
                        if (index === 0) {
                            // İlk sütun - öğrenci adı
                            cell.style.width = '35%';
                            cell.style.maxWidth = '35%';
                            cell.style.minWidth = '35%';
                        } else {
                            // Diğer sütunlar - hafta sütunları
                            cell.style.width = `${otherColumnWidth}%`;
                            cell.style.maxWidth = `${otherColumnWidth}%`;
                            cell.style.minWidth = `${otherColumnWidth}%`;
                            cell.style.textAlign = 'center';
                            cell.style.verticalAlign = 'middle';
                            cell.style.emptyCells = 'show';
                        }
                        cell.style.display = 'table-cell';
                        cell.style.border = '1px solid black';
                    });
                });
            }
            
            // Yazdırma işlemini başlat
            window.print();
            
            // Yazdırma işlemi tamamlandıktan sonra kısa bir süre bekle ve sonra yazdırma alanını kaldır
            setTimeout(() => {
                printSection.remove();
                console.log('Yazdırma alanı kaldırıldı');
            }, 1000);
        }, 700); // Yazdırma alanının doğru şekilde oluşturulması için biraz daha uzun bekle
    });

    // Upload alanına tıklandığında dosya seçimi yapma
    uploadArea.addEventListener('click', () => {
        debugLog('Upload alanına tıklandı');
        fileInput.click();
    });

    // Sürükle-bırak olayları
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        }, false);
    });

    // Dosya sürüklenip bırakıldığında
    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        
        debugLog('Dosya bırakıldı:', file ? file.name : 'Dosya yok');
        
        if (file && file.type === 'application/pdf') {
            fileInput.files = dt.files;
            processFile(file);
        } else {
            showError('Lütfen PDF dosyası yükleyin.');
        }
    });

    // Dosya seçildiğinde
    fileInput.addEventListener('change', () => {
        debugLog('Dosya seçme olayı tetiklendi');
        
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            debugLog('Seçilen dosya:', file.name);
            
            if (file.type === 'application/pdf') {
                processFile(file);
            } else {
                showError('Lütfen PDF dosyası yükleyin.');
            }
        } else {
            debugLog('Dosya seçilmedi');
        }
    });
    
    // Ödev çizelgesi butonlarına tıklanınca
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-homework-schedule')) {
            const button = e.target.closest('.btn-homework-schedule');
            const className = button.getAttribute('data-class');
            currentScheduleClass = className;
            
            // Modal başlığını sınıf adıyla güncelle
            document.getElementById('homeworkScheduleModalLabel').textContent = `${className} - Ödev Çizelgesi`;
            
            // Tarih alanlarını varsayılan değerlerle doldur
            setDefaultDates();
            
            // Modal'ı aç - bootstrap.Modal sınıfı kontrolü
            try {
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modal = new bootstrap.Modal(document.getElementById('homeworkScheduleModal'));
                    modal.show();
                    console.log('Modal açıldı');
                } else {
                    // jQuery yoluyla açmayı dene
                    console.log('Bootstrap Modal bulunamadı, alternatif yöntem deneniyor...');
                    $('#homeworkScheduleModal').modal('show');
                }
            } catch (error) {
                console.error('Modal açılırken hata oluştu:', error);
                // Manuel olarak aç
                const modalElement = document.getElementById('homeworkScheduleModal');
                modalElement.style.display = 'block';
                modalElement.classList.add('show');
            }
        }
        
        // Özel çizelge butonlarına tıklanınca
        if (e.target.closest('.btn-custom-schedule')) {
            const button = e.target.closest('.btn-custom-schedule');
            const className = button.getAttribute('data-class');
            currentScheduleClass = className;
            
            // Modal başlığını sınıf adıyla güncelle
            document.getElementById('customScheduleModalLabel').textContent = `${className} - Özel Çizelge`;
            
            // Sütun başlıklarını varsayılan değerlerle oluştur
            generateColumnHeaders();
            
            // Modal'ı aç
            try {
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modal = new bootstrap.Modal(document.getElementById('customScheduleModal'));
                    modal.show();
                    console.log('Özel çizelge modal açıldı');
                } else {
                    console.log('Bootstrap Modal bulunamadı, alternatif yöntem deneniyor...');
                    $('#customScheduleModal').modal('show');
                }
            } catch (error) {
                console.error('Modal açılırken hata oluştu:', error);
                const modalElement = document.getElementById('customScheduleModal');
                modalElement.style.display = 'block';
                modalElement.classList.add('show');
            }
        }
        
        // Sınıf oturma planı butonlarına tıklanınca
        if (e.target.closest('.btn-seating-plan')) {
            const button = e.target.closest('.btn-seating-plan');
            const className = button.getAttribute('data-class');
            currentScheduleClass = className;
            
            // Modal başlığını sınıf adıyla güncelle
            document.getElementById('seatingPlanModalLabel').textContent = `${className} - Sınıf Oturma Planı`;
            
            // Plan başlığını güncelle
            document.getElementById('seatingPlanTitle').value = `${className} Oturma Planı`;
            
            // Modal'ı aç
            try {
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modal = new bootstrap.Modal(document.getElementById('seatingPlanModal'));
                    modal.show();
                    console.log('Oturma planı modal açıldı');
                } else {
                    console.log('Bootstrap Modal bulunamadı, alternatif yöntem deneniyor...');
                    $('#seatingPlanModal').modal('show');
                }
            } catch (error) {
                console.error('Modal açılırken hata oluştu:', error);
                const modalElement = document.getElementById('seatingPlanModal');
                modalElement.style.display = 'block';
                modalElement.classList.add('show');
            }
        }
    });
    
    // Sayfanın yüklenmesinin tamamlandığını logla
    debugLog('Sayfa tamamen yüklendi, uygulama kullanıma hazır');


});



// PDF dosyasını işleme
async function processFile(file) {
    resetUI();
    showLoading(true);
    
    debugLog('PDF işleme başlatıldı:', file.name);
    
    try {
        const fileReader = new FileReader();
        
        fileReader.onload = async function() {
            debugLog('Dosya okuma tamamlandı, PDF işleniyor...');
            const typedArray = new Uint8Array(this.result);
            
            try {
                debugLog('PDF.js ile dosya yükleniyor...');
                const pdf = await pdfjsLib.getDocument({data: typedArray}).promise;
                debugLog(`PDF yüklendi, toplam sayfa sayısı: ${pdf.numPages}`);
                
                debugLog('Sınıf bilgileri çıkarılıyor...');
                const classes = await extractClassInfo(pdf);
                
                classesByName = classes;
                
                const classCount = Object.keys(classes).length;
                debugLog(`Toplam ${classCount} sınıf bulundu`);
                
                if (classCount === 0) {
                    debugLog('Hiç sınıf bulunamadı');
                    document.getElementById('no-results').classList.remove('hidden');
                    showLoading(false);
                    return;
                }
                
                // Veri önişleme - Eğer adın içinde numara varsa ayır
                Object.keys(classes).forEach(className => {
                    classes[className].forEach(student => {
                        // Eğer adın içinde numara varsa ayır
                        if (student.first_name.match(/^\d+\s+/)) {
                            const parts = student.first_name.trim().split(/\s+/);
                            // İlk kelime numaraysa
                            if (parts.length > 1 && /^\d+$/.test(parts[0])) {
                                student.student_no = parts[0];
                                // Geri kalan kısmı ad olarak al
                                student.first_name = parts.slice(1).join(' ');
                            }
                        }
                    });
                });
                
                debugLog('Sınıflar ve öğrenciler görüntüleniyor...');
                displayClassesAndStudents(classes);
                showLoading(false);
            } catch (err) {
                console.error('PDF işleme hatası:', err);
                debugLog('PDF işleme hatası: ' + err.message);
                showError('PDF dosyası işlenirken bir hata oluştu: ' + err.message);
                showLoading(false);
            }
        };
        
        fileReader.onerror = function(err) {
            debugLog('Dosya okuma hatası: ' + err);
            showError('Dosya okunamadı.');
            showLoading(false);
        };
        
        debugLog('Dosya okumaya başlanıyor...');
        fileReader.readAsArrayBuffer(file);
    } catch (err) {
        console.error('Dosya okuma hatası:', err);
        debugLog('Dosya işleme hatası: ' + err.message);
        showError('Dosya işlenirken hata oluştu: ' + err.message);
        showLoading(false);
    }
}

// Logger fonksiyonu
function debugLog(message, data) {
    console.log(message, data);
    if (debugMode) {
        let formattedMessage = message;
        if (data) {
            if (typeof data === 'object') {
                formattedMessage += '\n' + JSON.stringify(data, null, 2);
            } else {
                formattedMessage += ' ' + data;
            }
        }
        debugInfo.textContent += formattedMessage + '\n';
        // Otomatik kaydırma
        debugInfo.scrollTop = debugInfo.scrollHeight;
    }
}

// UI yardımcı fonksiyonları
function showLoading(isLoading) {
    const loadingElem = document.getElementById('loading');
    const uploadTextElem = document.getElementById('upload-text');
    
    if (isLoading) {
        loadingElem.classList.remove('hidden');
        uploadTextElem.classList.add('hidden');
    } else {
        loadingElem.classList.add('hidden');
        uploadTextElem.classList.remove('hidden');
    }
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    debugLog('Hata mesajı gösteriliyor:', message);
    
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

function resetUI() {
    const errorMessage = document.getElementById('error-message');
    const resultsContainer = document.getElementById('results-container');
    const noResults = document.getElementById('no-results');
    
    errorMessage.classList.add('hidden');
    resultsContainer.innerHTML = '';
    noResults.classList.add('hidden');
}

// CSV dosyası oluşturma ve indirme yardımcı fonksiyonu
window.downloadClassCSV = function(className) {
    const students = classesByName[className];
    let csvContent = 'Öğrenci No,Adı,Soyadı\n';
    
    students.forEach(student => {
        csvContent += `${student.student_no},${student.first_name},${student.last_name}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${className.replace(/[^a-z0-9]/gi, '_')}_ogrenci_listesi.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    debugLog(`'${className}' sınıfı için CSV indirildi`);
}; 