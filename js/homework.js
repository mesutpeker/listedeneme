// Varsayılan tarih değerlerini ayarlama
function setDefaultDates() {
    const today = new Date();
    const startDate = today;
    const endDate = new Date();
    endDate.setDate(today.getDate() + 28); // 4 hafta sonra
    
    document.getElementById('startDate').valueAsDate = startDate;
    document.getElementById('endDate').valueAsDate = endDate;
}

// Ödev çizelgesi oluşturma
function generateHomeworkSchedule(startDate, endDate, forPrint = false) {
    console.log('Çizelge oluşturuluyor:', startDate, endDate);
    
    // Öğrenci listesini al
    const students = classesByName[currentScheduleClass];
    if (!students || students.length === 0) {
        alert('Bu sınıfta öğrenci bulunamadı.');
        return;
    }
    
    console.log('Öğrenci sayısı:', students.length);
    
    // Çizelge türünü kontrol et
    const scheduleType = document.querySelector('input[name="scheduleType"]:checked').value;
    
    // Tarih aralığındaki dönemleri hesapla (haftalık veya günlük)
    let periods;
    if (scheduleType === 'weekly') {
        periods = getWeeksInRange(startDate, endDate);
        console.log('Hesaplanan haftalar:', periods);
    } else {
        periods = getDaysInRange(startDate, endDate);
        console.log('Hesaplanan günler:', periods);
    }
    
    if (periods.length === 0) {
        alert(`Seçilen tarih aralığında ${scheduleType === 'weekly' ? 'hafta' : 'gün'} bulunamadı.`);
        return;
    }
    
    // Önizleme için tabloyu oluştur
    const scheduleTable = createScheduleTable(students, periods, scheduleType);
    
    // Eğer yazdırma için değilse, önizleme alanını güncelle
    if (!forPrint) {
        const previewArea = document.getElementById('schedulePreview');
        previewArea.innerHTML = '';
        
        // Önizleme için uyarı notu
        const previewNote = document.createElement('div');
        previewNote.className = 'alert alert-info mb-2';
        previewNote.innerHTML = `
            <small><i class="bi bi-info-circle"></i> Yazdırıldığında tablo A4 yatay sayfaya otomatik sığdırılacaktır. Buradaki görünüm sadece önizleme amaçlıdır.</small>
        `;
        previewArea.appendChild(previewNote);
        previewArea.appendChild(scheduleTable.cloneNode(true));
    }
    
    // Yazdırma için tabloyu oluştur
    const printSection = createPrintableVersion(currentScheduleClass, scheduleTable.cloneNode(true));
    
    // Var olan yazdırma alanını temizle
    const oldPrintArea = document.getElementById('homeworkSchedulePrint');
    if (oldPrintArea) {
        oldPrintArea.remove();
    }
    
    // Yazdırma alanını document.body'ye ekle
    // Yazdırma için hemen görünür olacak, önizleme için gizli olacak
    printSection.style.display = forPrint ? 'block' : 'none';
    document.body.appendChild(printSection);
    
    // Yazdır butonunu etkinleştir
    document.getElementById('printScheduleBtn').disabled = false;
    console.log('Çizelge oluşturuldu ve hazırlandı, forPrint:', forPrint);
    
    return printSection; // Dönüş değeri ekledik
}

// Tarih aralığındaki haftaları hesaplama
function getWeeksInRange(startDate, endDate) {
    const weeks = [];
    
    // Tarih doğruluğu kontrolü
    if (!(startDate instanceof Date) || !(endDate instanceof Date) || isNaN(startDate) || isNaN(endDate)) {
        console.error('Geçersiz tarih:', { startDate, endDate });
        return weeks;
    }
    
    console.log('Hafta hesaplama başlangıcı:', { startDate, endDate });
    
    const currentDate = new Date(startDate);
    let weekCounter = 0;
    
    // Her hafta için bir tarih aralığı ekle
    while (currentDate <= endDate && weekCounter < 20) { // Güvenlik için maksimum 20 hafta
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6); // 7 günlük hafta
        
        weeks.push({
            start: new Date(weekStart),
            end: new Date(weekEnd > endDate ? endDate : weekEnd)
        });
        
        console.log(`Hafta ${weekCounter + 1} eklendi:`, { 
            start: formatDate(weekStart), 
            end: formatDate(weekEnd > endDate ? endDate : weekEnd) 
        });
        
        // Sonraki haftaya geç
        currentDate.setDate(currentDate.getDate() + 7);
        weekCounter++;
    }
    
    console.log(`Toplam ${weeks.length} hafta bulundu`);
    return weeks;
}

// Tarih aralığındaki günleri hesaplama (seçilen günler için)
function getDaysInRange(startDate, endDate) {
    const days = [];
    
    // Tarih doğruluğu kontrolü
    if (!(startDate instanceof Date) || !(endDate instanceof Date) || isNaN(startDate) || isNaN(endDate)) {
        console.error('Geçersiz tarih:', { startDate, endDate });
        return days;
    }
    
    // Seçilen günleri al
    const selectedDays = [];
    document.querySelectorAll('.day-checkbox:checked').forEach(checkbox => {
        selectedDays.push(parseInt(checkbox.value));
    });
    
    if (selectedDays.length === 0) {
        alert('Lütfen en az bir gün seçin.');
        return days;
    }
    
    console.log('Gün hesaplama başlangıcı:', { startDate, endDate, selectedDays });
    
    const currentDate = new Date(startDate);
    let dayCounter = 0;
    
    // Her gün için kontrol et, seçilen günler arasındaysa ekle
    while (currentDate <= endDate && dayCounter < 300) { // Güvenlik için maksimum 300 gün
        const dayOfWeek = currentDate.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
        
        if (selectedDays.includes(dayOfWeek)) {
            days.push({
                start: new Date(currentDate),
                end: new Date(currentDate),
                dayName: getDayName(dayOfWeek)
            });
            
            console.log(`Gün ${days.length} eklendi:`, { 
                date: formatDate(currentDate), 
                dayName: getDayName(dayOfWeek) 
            });
        }
        
        // Sonraki güne geç
        currentDate.setDate(currentDate.getDate() + 1);
        dayCounter++;
    }
    
    console.log(`Toplam ${days.length} gün bulundu`);
    return days;
}

// Gün adını getirme
function getDayName(dayNumber) {
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return dayNames[dayNumber];
}

// Çizelge tablosunu oluşturma
function createScheduleTable(students, periods, scheduleType) {
    const table = document.createElement('table');
    table.className = 'table table-bordered table-sm';
    table.style.tableLayout = 'fixed';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.borderSpacing = '0';
    table.style.emptyCells = 'show';
    table.style.border = '2px solid black';
    
    // Başlık satırı
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Sütun genişliği hesaplaması - günlük modda daha dar sütunlar
    let studentColumnWidth, periodColumnWidth;
    
    if (scheduleType === 'daily' && periods.length > 10) {
        // Çok fazla gün varsa öğrenci sütununu daha dar yap
        studentColumnWidth = 20;
        periodColumnWidth = (80 / periods.length).toFixed(2);
    } else if (periods.length > 15) {
        // Çok fazla dönem varsa öğrenci sütununu daha dar yap
        studentColumnWidth = 15;
        periodColumnWidth = (85 / periods.length).toFixed(2);
    } else {
        // Normal durumda
        studentColumnWidth = 25;
        periodColumnWidth = (75 / periods.length).toFixed(2);
    }
    
    // Öğrenci numarası sütunu
    const thStudentNo = document.createElement('th');
    thStudentNo.textContent = 'ÖĞRENCİ NO';
    thStudentNo.style.width = `${studentColumnWidth * 0.35}%`; // Öğrenci no için daha dar
    thStudentNo.style.minWidth = `${studentColumnWidth * 0.35}%`;
    thStudentNo.style.maxWidth = `${studentColumnWidth * 0.35}%`;
    thStudentNo.style.textAlign = 'center';
    thStudentNo.style.padding = '2px 5px';
    thStudentNo.style.verticalAlign = 'bottom';
    thStudentNo.style.fontWeight = 'bold';
    thStudentNo.style.border = '2px solid black';
    headerRow.appendChild(thStudentNo);

    // Öğrenci adı sütunu
    const thStudent = document.createElement('th');
    thStudent.textContent = 'ÖĞRENCİ ADI';
    thStudent.style.width = `${studentColumnWidth * 0.65}%`; // Öğrenci adı için daha geniş
    thStudent.style.minWidth = `${studentColumnWidth * 0.65}%`;
    thStudent.style.maxWidth = `${studentColumnWidth * 0.65}%`;
    thStudent.style.textAlign = 'left';
    thStudent.style.padding = '2px 5px';
    thStudent.style.verticalAlign = 'bottom';
    thStudent.style.fontWeight = 'bold';
    thStudent.style.border = '2px solid black';
    headerRow.appendChild(thStudent);
    
    // Hafta sütunları için kalan genişliği hesapla
    const weekColumnWidth = (75 / periods.length).toFixed(2); // 75% kalan genişlik
    
    periods.forEach((period, index) => {
        const th = document.createElement('th');
        th.style.width = `${periodColumnWidth}%`;
        th.style.minWidth = `${periodColumnWidth}%`;
        th.style.maxWidth = `${periodColumnWidth}%`;
        th.style.padding = '2px 1px';
        th.style.textAlign = 'center';
        th.style.verticalAlign = 'bottom';
        th.style.position = 'relative';
        th.style.fontWeight = 'bold';
        th.style.border = '2px solid black';
        
        // Yatay başlık için normal metin kullan
        if (scheduleType === 'weekly') {
            th.innerHTML = `HAFTA ${index + 1}<br>${formatDate(period.start)}<br>${formatDate(period.end)}`;
        } else {
            th.innerHTML = `${period.dayName}<br>${formatDate(period.start)}`;
        }
        
        // Başlık stillerini ayarla
        th.style.whiteSpace = 'normal';
        th.style.wordWrap = 'break-word';
        th.style.fontSize = '10px';
        th.style.fontWeight = 'bold';
        th.style.height = 'auto';
        th.style.minHeight = '40px';
        th.style.lineHeight = '1.1';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Öğrenci satırları
    const tbody = document.createElement('tbody');
    students.forEach((student, index) => {
        const row = document.createElement('tr');
        row.style.height = '25px';
        
        // Öğrenci numarası sütunu
        const tdStudentNo = document.createElement('td');
        tdStudentNo.textContent = student.student_no;
        tdStudentNo.style.width = `${studentColumnWidth * 0.35}%`;
        tdStudentNo.style.minWidth = `${studentColumnWidth * 0.35}%`;
        tdStudentNo.style.maxWidth = `${studentColumnWidth * 0.35}%`;
        tdStudentNo.style.textAlign = 'center';
        tdStudentNo.style.paddingLeft = '2px';
        tdStudentNo.style.paddingRight = '2px';
        tdStudentNo.style.whiteSpace = 'nowrap';
        tdStudentNo.style.overflow = 'visible';
        tdStudentNo.style.fontSize = '9px';
        tdStudentNo.style.lineHeight = '1.2';
        tdStudentNo.style.height = '25px';
        tdStudentNo.style.fontWeight = 'bold';
        tdStudentNo.style.borderLeft = '2px solid black';
        tdStudentNo.style.borderRight = '1px solid black';
        tdStudentNo.title = student.student_no;
        
        // Son satır için alt kenarlık
        if (index === students.length - 1) {
            tdStudentNo.style.borderBottom = '2px solid black';
        }
        
        row.appendChild(tdStudentNo);

        // Öğrenci adı sütunu
        const tdName = document.createElement('td');
        tdName.textContent = `${student.first_name} ${student.last_name}`;
        tdName.style.width = `${studentColumnWidth * 0.65}%`;
        tdName.style.minWidth = `${studentColumnWidth * 0.65}%`;
        tdName.style.maxWidth = `${studentColumnWidth * 0.65}%`;
        tdName.style.textAlign = 'left';
        tdName.style.paddingLeft = '5px';
        tdName.style.whiteSpace = 'normal';
        tdName.style.overflow = 'visible';
        tdName.style.fontSize = '9px';
        tdName.style.lineHeight = '1.2';
        tdName.style.height = '25px';
        tdName.style.fontWeight = 'bold';
        tdName.style.borderLeft = '1px solid black';
        tdName.style.borderRight = '2px solid black';
        tdName.title = `${student.first_name} ${student.last_name}`;
        
        // Son satır için alt kenarlık
        if (index === students.length - 1) {
            tdName.style.borderBottom = '2px solid black';
        }
        
        row.appendChild(tdName);
        
        // Hafta sütunları
        periods.forEach((_, periodIndex) => {
            const td = document.createElement('td');
            td.style.width = `${periodColumnWidth}%`;
            td.style.minWidth = `${periodColumnWidth}%`;
            td.style.maxWidth = `${periodColumnWidth}%`;
            td.style.textAlign = 'center';
            td.style.verticalAlign = 'middle';
            td.style.padding = '2px 1px';
            td.style.border = '1px solid #666';
            td.style.height = '25px';
            
            // Son satır için alt kenarlık
            if (index === students.length - 1) {
                td.style.borderBottom = '2px solid black';
            }
            
            td.innerHTML = '&nbsp;';
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    return table;
}

// Yazdırılabilir versiyonu oluşturma
function createPrintableVersion(className, table) {
    // Print wrapper
    const printWrapper = document.createElement('div');
    printWrapper.id = 'homeworkSchedulePrint'; // Print div'i için doğrudan ID atıyoruz
    printWrapper.style.width = '100%';
    printWrapper.style.maxWidth = '100%'; // A4 genişliği (yatay)
    printWrapper.style.minHeight = 'auto'; // A4 yüksekliği (yatay) yerine auto
    printWrapper.style.margin = '0'; // Sayfayı ortala
    printWrapper.style.pageBreakInside = 'avoid';
    printWrapper.style.pageBreakAfter = 'avoid';
    printWrapper.style.overflow = 'visible';
    printWrapper.style.position = 'relative';
    printWrapper.style.backgroundColor = 'white';
    printWrapper.style.display = 'block';
    printWrapper.style.boxSizing = 'border-box';
    
    // Satır ve sütun sayısına göre CSS sınıfları ekle
    // Sütun (hafta) sayısına göre sınıf ekle
    const columnCount = table.querySelectorAll('th').length - 1; // Öğrenci adı sütununu çıkar
    if (columnCount <= 5) {
        printWrapper.classList.add('cols-1-5');
    } else if (columnCount <= 10) {
        printWrapper.classList.add('cols-6-10');
    } else if (columnCount <= 15) {
        printWrapper.classList.add('cols-11-15');
    } else {
        printWrapper.classList.add('cols-16-20');
    }
    
    // Satır (öğrenci) sayısına göre sınıf ekle
    const rowCount = table.querySelectorAll('tbody tr').length;
    if (rowCount <= 15) {
        printWrapper.classList.add('rows-1-15');
    } else if (rowCount <= 30) {
        printWrapper.classList.add('rows-16-30');
    } else {
        printWrapper.classList.add('rows-31-plus');
    }
    
    // İçerik konteyneri
    const container = document.createElement('div');
    container.style.padding = '0.2cm';
    container.style.overflow = 'visible';
    container.style.pageBreakInside = 'avoid';
    container.style.pageBreakAfter = 'avoid';
    container.style.height = 'auto'; // A4 yüksekliğine sabitlenmedi
    container.style.width = '100%'; // Genişliği %100 yap
    container.style.boxSizing = 'border-box';
    
    // Başlık
    const title = document.createElement('h3');
    // Özelleştirilmiş başlığı al, yoksa varsayılan başlığı kullan
    const customTitle = document.getElementById('scheduleTitle').value.trim();
    const titleText = customTitle || 'Ödev Çizelgesi';
    title.textContent = `${className} - ${titleText}`;
    title.style.textAlign = 'center';
    title.style.margin = '0 0 0.1cm 0';
    title.style.padding = '0';
    title.style.fontSize = '12px';
    title.style.fontWeight = 'bold';
    title.style.display = 'block';
    
    container.appendChild(title);
    
    // Tablo genişliği ayarlama
    table.className = 'print-table'; // CSS sınıfı ekle
    table.style.width = '100%';
    table.style.height = 'auto';
    table.style.fontSize = columnCount > 10 ? '7px' : '8px';
    table.style.borderCollapse = 'collapse';
    table.style.tableLayout = 'fixed';
    table.style.margin = '0';
    table.style.pageBreakInside = 'avoid';
    table.style.border = '1px solid #000';
    table.style.boxSizing = 'border-box';
    table.style.transformOrigin = 'top left'; // Transform origin ekle
    
    // TH ve TD stillerini güncelle
    const allCells = table.querySelectorAll('th, td');
    allCells.forEach(cell => {
        cell.style.border = '1px solid #000';
        cell.style.padding = '2px';
        cell.style.boxSizing = 'border-box';
    });
    
    // Tüm satır ve hücrelerin stillerini ayarla
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        row.style.height = 'auto';
        row.style.pageBreakInside = 'avoid';
    });
    
    // İlk sütun (öğrenci adı) genişliğini ayarla
    const firstColumnCells = table.querySelectorAll('tr > *:first-child');
    firstColumnCells.forEach(cell => {
        cell.style.width = '25%'; // 35% yerine 25% yap
        cell.style.maxWidth = '25%'; // 35% yerine 25% yap
        cell.style.textAlign = 'left';
        cell.style.paddingLeft = '5px';
        cell.style.whiteSpace = 'normal'; // Öğrenci ismi için normal text wrap
        cell.style.overflow = 'visible'; // Taşan metin görünsün
        cell.style.textOverflow = 'clip'; // Ellipsis yerine clip kullan
        cell.style.fontWeight = 'normal';
        cell.style.padding = '2px 5px';
        cell.style.fontSize = '9px';
        cell.style.lineHeight = '1.1';
    });
    
    // Diğer sütunların genişliğini hafta sayısına göre dinamik ayarla
    const otherColumnCells = table.querySelectorAll('tr > *:not(:first-child)');
    const weekWidth = 75 / columnCount; // 65 yerine 75 yap
    otherColumnCells.forEach(cell => {
        cell.style.width = `${weekWidth}%`;
        cell.style.maxWidth = `${weekWidth}%`;
        cell.style.minWidth = `${weekWidth}%`;
        cell.style.textAlign = 'center';
        cell.style.padding = '2px 1px';
    });
    
    // Yatay başlıkları hizala (dikey başlık divleri artık yok)
    const periodHeaders = table.querySelectorAll('th:not(:first-child):not(:nth-child(2))');
    periodHeaders.forEach(th => {
        th.style.fontSize = '10px';
        th.style.fontWeight = 'bold';
        th.style.whiteSpace = 'normal';
        th.style.wordWrap = 'break-word';
        th.style.minHeight = '40px';
        th.style.padding = '4px 2px';
        th.style.lineHeight = '1.2';
    });
    
    // Başlık hücrelerini güncelle
    const headerCells = table.querySelectorAll('th');
    headerCells.forEach(th => {
        th.style.backgroundColor = '#f2f2f2';
        th.style.fontWeight = 'bold';
        th.style.position = 'sticky';
        th.style.top = '0';
        th.style.verticalAlign = 'bottom';
    });
    
    container.appendChild(table);
    printWrapper.appendChild(container);
    
    return printWrapper;
}

// Yazdırma işlemi
document.getElementById('printScheduleBtn').addEventListener('click', function() {
    // Önce tarihleri kontrol et
    const startDate = document.getElementById('startDate').valueAsDate;
    const endDate = document.getElementById('endDate').valueAsDate;
    
    if (!startDate || !endDate) {
        alert('Lütfen geçerli bir tarih aralığı seçin.');
        return;
    }
    
    if (startDate > endDate) {
        alert('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
        return;
    }
    
    // Yazdırma için yeni çizelge oluştur (forPrint=true)
    generateHomeworkSchedule(startDate, endDate, true);
    
    // Sayfa hazırsa yazdır
    setTimeout(() => {
        // Yazdırma tablosunun boyutunu kontrol et ve ayarla
        const printArea = document.getElementById('homeworkSchedulePrint');
        if (printArea) {
            const columnCount = printArea.querySelector('table').querySelectorAll('th').length - 1;
            if (columnCount > 10) {
                // Kolonlar sayfa genişliğine sığmayabilir, fontları daha da küçült
                printArea.querySelectorAll('th, td').forEach(cell => {
                    cell.style.fontSize = cell.tagName === 'TH' ? '6px' : '7px';
                    cell.style.padding = '1px';
                });
                
                // Yatay başlıkları daha kompakt hale getir
                printArea.querySelectorAll('th:not(:first-child):not(:nth-child(2))').forEach(th => {
                    th.style.fontSize = '9px';
                    th.style.minHeight = '35px';
                    th.style.padding = '3px 1px';
                });
            }
            
            // Yazdırma işlemini başlat
            window.print();
            
            // Yazdırma işlemi tamamlandıktan sonra gizle
            setTimeout(() => {
                printArea.style.display = 'none';
            }, 1000);
        }
    }, 300);
});

// Tarih formatı
function formatDate(date) {
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}

// ====== ÖZEL ÇİZELGE FONKSİYONLARI ======

// Sütun başlık input'larını oluşturma
function generateColumnHeaders() {
    const columnCount = parseInt(document.getElementById('columnCount').value) || 5;
    const columnHeadersContainer = document.getElementById('columnHeaders');
    
    // Önce mevcut input'ları temizle
    columnHeadersContainer.innerHTML = '';
    
    // Her sütun için input oluştur
    for (let i = 0; i < columnCount; i++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-md-4 mb-2';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control column-header-input';
        input.id = `columnHeader${i}`;
        input.placeholder = `Sütun ${i + 1} başlığı`;
        input.value = `Sütun ${i + 1}`;
        
        colDiv.appendChild(input);
        columnHeadersContainer.appendChild(colDiv);
    }
    
    console.log(`${columnCount} sütun için başlık input'ları oluşturuldu`);
}

// Özel çizelge oluşturma
function generateCustomSchedule() {
    console.log('Özel çizelge oluşturuluyor...');
    
    // Öğrenci listesini al
    const students = classesByName[currentScheduleClass];
    if (!students || students.length === 0) {
        alert('Bu sınıfta öğrenci bulunamadı.');
        return;
    }
    
    // Sütun başlıklarını al
    const columnHeaders = [];
    const columnInputs = document.querySelectorAll('.column-header-input');
    
    columnInputs.forEach(input => {
        const headerText = input.value.trim();
        if (headerText) {
            columnHeaders.push(headerText);
        }
    });
    
    if (columnHeaders.length === 0) {
        alert('Lütfen en az bir sütun başlığı girin.');
        return;
    }
    
    console.log('Sütun başlıkları:', columnHeaders);
    console.log('Öğrenci sayısı:', students.length);
    
    // Özel çizelge tablosunu oluştur
    const customTable = createCustomScheduleTable(students, columnHeaders);
    
    // Önizleme alanını güncelle
    const previewArea = document.getElementById('customSchedulePreview');
    previewArea.innerHTML = '';
    
    // Önizleme için uyarı notu
    const previewNote = document.createElement('div');
    previewNote.className = 'alert alert-info mb-2';
    previewNote.innerHTML = `
        <small><i class="bi bi-info-circle"></i> Yazdırıldığında tablo A4 yatay sayfaya otomatik sığdırılacaktır. Buradaki görünüm sadece önizleme amaçlıdır.</small>
    `;
    previewArea.appendChild(previewNote);
    previewArea.appendChild(customTable.cloneNode(true));
    
    // Yazdırma için tabloyu oluştur
    const printSection = createCustomPrintableVersion(currentScheduleClass, customTable.cloneNode(true));
    
    // Var olan yazdırma alanını temizle
    const oldPrintArea = document.getElementById('customSchedulePrint');
    if (oldPrintArea) {
        oldPrintArea.remove();
    }
    
    // Yazdırma alanını document.body'ye ekle (gizli olarak)
    printSection.style.display = 'none';
    document.body.appendChild(printSection);
    
    // Yazdır butonunu etkinleştir
    document.getElementById('printCustomScheduleBtn').disabled = false;
    console.log('Özel çizelge oluşturuldu ve hazırlandı');
    
    return printSection;
}

// Özel çizelge tablosunu oluşturma
function createCustomScheduleTable(students, columnHeaders) {
    const table = document.createElement('table');
    table.className = 'table table-bordered table-sm';
    table.style.tableLayout = 'fixed';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.borderSpacing = '0';
    table.style.emptyCells = 'show';
    table.style.border = '2px solid black';
    
    // Sütun genişliği hesaplaması
    const totalColumns = columnHeaders.length + 2; // Öğrenci no + öğrenci adı + özel sütunlar
    const studentNoColumnWidth = 8.75;  // %8.75 öğrenci numarası için
    const studentNameColumnWidth = 16.25; // %16.25 öğrenci adı için
    const customColumnWidth = (75 / columnHeaders.length).toFixed(2); // Kalan %75'i özel sütunlar arasında böl
    
    // Başlık satırı
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Öğrenci numarası sütunu
    const thStudentNo = document.createElement('th');
    thStudentNo.textContent = 'ÖĞRENCİ NO';
    thStudentNo.style.width = `${studentNoColumnWidth}%`;
    thStudentNo.style.minWidth = `${studentNoColumnWidth}%`;
    thStudentNo.style.maxWidth = `${studentNoColumnWidth}%`;
    thStudentNo.style.textAlign = 'center';
    thStudentNo.style.padding = '2px 5px';
    thStudentNo.style.verticalAlign = 'bottom';
    thStudentNo.style.fontWeight = 'bold';
    thStudentNo.style.border = '2px solid black';
    headerRow.appendChild(thStudentNo);
    
    // Öğrenci adı sütunu
    const thStudent = document.createElement('th');
    thStudent.textContent = 'ÖĞRENCİ ADI';
    thStudent.style.width = `${studentNameColumnWidth}%`;
    thStudent.style.minWidth = `${studentNameColumnWidth}%`;
    thStudent.style.maxWidth = `${studentNameColumnWidth}%`;
    thStudent.style.textAlign = 'left';
    thStudent.style.padding = '2px 5px';
    thStudent.style.verticalAlign = 'bottom';
    thStudent.style.fontWeight = 'bold';
    thStudent.style.border = '2px solid black';
    headerRow.appendChild(thStudent);
    
    // Özel sütun başlıkları
    columnHeaders.forEach((header, index) => {
        const th = document.createElement('th');
        th.style.width = `${customColumnWidth}%`;
        th.style.minWidth = `${customColumnWidth}%`;
        th.style.maxWidth = `${customColumnWidth}%`;
        th.style.padding = '2px 1px';
        th.style.textAlign = 'center';
        th.style.verticalAlign = 'bottom';
        th.style.position = 'relative';
        th.style.fontWeight = 'bold';
        th.style.border = '2px solid black';
        
        // Yatay başlık için normal metin kullan
        th.textContent = header;
        
        // Başlık stillerini ayarla
        th.style.whiteSpace = 'normal';
        th.style.wordWrap = 'break-word';
        th.style.fontSize = '10px';
        th.style.fontWeight = 'bold';
        th.style.height = 'auto';
        th.style.minHeight = '40px';
        th.style.lineHeight = '1.2';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Öğrenci satırları
    const tbody = document.createElement('tbody');
    students.forEach((student, index) => {
        const row = document.createElement('tr');
        row.style.height = '25px';
        
        // Öğrenci numarası sütunu
        const tdStudentNo = document.createElement('td');
        tdStudentNo.textContent = student.student_no;
        tdStudentNo.style.width = `${studentNoColumnWidth}%`;
        tdStudentNo.style.minWidth = `${studentNoColumnWidth}%`;
        tdStudentNo.style.maxWidth = `${studentNoColumnWidth}%`;
        tdStudentNo.style.textAlign = 'center';
        tdStudentNo.style.paddingLeft = '2px';
        tdStudentNo.style.paddingRight = '2px';
        tdStudentNo.style.whiteSpace = 'nowrap';
        tdStudentNo.style.overflow = 'visible';
        tdStudentNo.style.fontSize = '9px';
        tdStudentNo.style.lineHeight = '1.2';
        tdStudentNo.style.height = '25px';
        tdStudentNo.style.fontWeight = 'bold';
        tdStudentNo.style.borderLeft = '2px solid black';
        tdStudentNo.style.borderRight = '1px solid black';
        tdStudentNo.title = student.student_no;
        
        // Son satır için alt kenarlık
        if (index === students.length - 1) {
            tdStudentNo.style.borderBottom = '2px solid black';
        }
        
        row.appendChild(tdStudentNo);
        
        // Öğrenci adı sütunu
        const tdName = document.createElement('td');
        tdName.textContent = `${student.first_name} ${student.last_name}`;
        tdName.style.width = `${studentNameColumnWidth}%`;
        tdName.style.minWidth = `${studentNameColumnWidth}%`;
        tdName.style.maxWidth = `${studentNameColumnWidth}%`;
        tdName.style.textAlign = 'left';
        tdName.style.paddingLeft = '5px';
        tdName.style.whiteSpace = 'normal';
        tdName.style.overflow = 'visible';
        tdName.style.fontSize = '9px';
        tdName.style.lineHeight = '1.2';
        tdName.style.height = '25px';
        tdName.style.fontWeight = 'bold';
        tdName.style.borderLeft = '1px solid black';
        tdName.style.borderRight = '1px solid black';
        tdName.title = `${student.first_name} ${student.last_name}`;
        
        // Son satır için alt kenarlık
        if (index === students.length - 1) {
            tdName.style.borderBottom = '2px solid black';
        }
        
        row.appendChild(tdName);
        
        // Özel sütunlar
        columnHeaders.forEach((_, columnIndex) => {
            const td = document.createElement('td');
            td.style.width = `${customColumnWidth}%`;
            td.style.minWidth = `${customColumnWidth}%`;
            td.style.maxWidth = `${customColumnWidth}%`;
            td.style.textAlign = 'center';
            td.style.verticalAlign = 'middle';
            td.style.padding = '2px 1px';
            td.style.border = '1px solid #666';
            td.style.height = '25px';
            
            // Son satır için alt kenarlık
            if (index === students.length - 1) {
                td.style.borderBottom = '2px solid black';
            }
            
            td.innerHTML = '&nbsp;';
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    return table;
}

// Özel çizelge için yazdırılabilir versiyonu oluşturma
function createCustomPrintableVersion(className, table) {
    // Print wrapper
    const printWrapper = document.createElement('div');
    printWrapper.id = 'customSchedulePrint';
    printWrapper.style.width = '100%';
    printWrapper.style.maxWidth = '100%';
    printWrapper.style.minHeight = 'auto';
    printWrapper.style.margin = '0';
    printWrapper.style.pageBreakInside = 'avoid';
    printWrapper.style.pageBreakAfter = 'avoid';
    printWrapper.style.overflow = 'visible';
    printWrapper.style.position = 'relative';
    printWrapper.style.backgroundColor = 'white';
    printWrapper.style.display = 'block';
    printWrapper.style.boxSizing = 'border-box';
    
    // Satır ve sütun sayısına göre CSS sınıfları ekle
    const columnCount = table.querySelectorAll('th').length - 2; // Öğrenci no ve adı sütunlarını çıkar
    if (columnCount <= 5) {
        printWrapper.classList.add('cols-1-5');
    } else if (columnCount <= 10) {
        printWrapper.classList.add('cols-6-10');
    } else if (columnCount <= 15) {
        printWrapper.classList.add('cols-11-15');
    } else {
        printWrapper.classList.add('cols-16-20');
    }
    
    const rowCount = table.querySelectorAll('tbody tr').length;
    if (rowCount <= 15) {
        printWrapper.classList.add('rows-1-15');
    } else if (rowCount <= 30) {
        printWrapper.classList.add('rows-16-30');
    } else {
        printWrapper.classList.add('rows-31-plus');
    }
    
    // İçerik konteyneri
    const container = document.createElement('div');
    container.style.padding = '0.2cm';
    container.style.overflow = 'visible';
    container.style.pageBreakInside = 'avoid';
    container.style.pageBreakAfter = 'avoid';
    container.style.height = 'auto';
    container.style.width = '100%';
    container.style.boxSizing = 'border-box';
    
    // Başlık
    const title = document.createElement('h3');
    const customTitle = document.getElementById('customScheduleTitle').value.trim();
    const titleText = customTitle || 'Özel Çizelge';
    title.textContent = `${className} - ${titleText}`;
    title.style.textAlign = 'center';
    title.style.margin = '0 0 0.1cm 0';
    title.style.padding = '0';
    title.style.fontSize = '12px';
    title.style.fontWeight = 'bold';
    title.style.display = 'block';
    
    container.appendChild(title);
    
    // Tablo genişliği ayarlama
    table.className = 'custom-print-table';
    table.style.width = '100%';
    table.style.height = 'auto';
    table.style.fontSize = columnCount > 10 ? '7px' : '8px';
    table.style.borderCollapse = 'collapse';
    table.style.tableLayout = 'fixed';
    table.style.margin = '0';
    table.style.pageBreakInside = 'avoid';
    
    container.appendChild(table);
    printWrapper.appendChild(container);
    
    return printWrapper;
}

// Özel çizelge event listener'ları (DOMContentLoaded event'i içinde çalışacak)
document.addEventListener('DOMContentLoaded', function() {
    // Sütun sayısı değiştiğinde başlık input'larını yeniden oluştur
    const columnCountInput = document.getElementById('columnCount');
    if (columnCountInput) {
        columnCountInput.addEventListener('input', generateColumnHeaders);
    }
    
    // Özel çizelge oluştur butonu
    const generateCustomBtn = document.getElementById('generateCustomScheduleBtn');
    if (generateCustomBtn) {
        generateCustomBtn.addEventListener('click', generateCustomSchedule);
    }
    
    // Özel çizelge yazdır butonu
    const printCustomBtn = document.getElementById('printCustomScheduleBtn');
    if (printCustomBtn) {
        printCustomBtn.addEventListener('click', function() {
            console.log('Özel çizelge yazdır butonu tıklandı');
            
            const printSection = document.getElementById('customSchedulePrint');
            if (!printSection) {
                alert('Önce çizelgeyi oluşturun.');
                return;
            }
            
            // Yazdırma için tabloyu görünür yap
            printSection.style.display = 'block';
            
            // Yazdırma işlemini başlat
            setTimeout(() => {
                console.log('Özel çizelge yazdırma başlatılıyor');
                window.print();
                
                // Yazdırma işleminden sonra gizle
                setTimeout(() => {
                    printSection.style.display = 'none';
                }, 1000);
            }, 100);
        });
    }
}); 