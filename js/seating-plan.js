// Sınıf Oturma Planı JavaScript Fonksiyonları

let currentSeatingPlan = null;
let selectedStudent = null;

// Event delegation kullanarak butonlara tıklama olaylarını dinle
document.addEventListener('click', function(e) {
    // Oluştur butonuna tıklanınca
    if (e.target && e.target.id === 'generateSeatingPlanBtn') {
        console.log('Oluştur butonuna tıklandı!');
        
        // Global değişkenleri kontrol et
        console.log('currentScheduleClass:', typeof currentScheduleClass !== 'undefined' ? currentScheduleClass : 'tanımsız');
        console.log('classesByName:', typeof classesByName !== 'undefined' ? Object.keys(classesByName) : 'tanımsız');
        
        const deskCount = parseInt(document.getElementById('deskCount').value);
        const planTitle = document.getElementById('seatingPlanTitle').value || 'Sınıf Oturma Planı';
        
        console.log('Sıra sayısı:', deskCount);
        console.log('Plan başlığı:', planTitle);
        
        if (!deskCount || deskCount < 1 || deskCount > 30) {
            alert('Lütfen 1-30 arasında geçerli bir sıra sayısı girin.');
            return;
        }
        
        if (typeof currentScheduleClass === 'undefined' || !currentScheduleClass) {
            alert('Sınıf seçilmedi. Lütfen önce bir sınıf seçin.');
            return;
        }
        
        if (typeof classesByName === 'undefined' || !classesByName[currentScheduleClass]) {
            alert('Öğrenci listesi bulunamadı. Lütfen önce PDF dosyasını yükleyin.');
            return;
        }
        
        generateSeatingPlan(deskCount, planTitle);
    }
    
    // Karıştır butonuna tıklanınca
    if (e.target && e.target.id === 'shuffleSeatingPlanBtn') {
        console.log('Karıştır butonuna tıklandı!');
        if (currentSeatingPlan) {
            shuffleSeatingPlan();
        }
    }
    
    // Yazdır butonuna tıklanınca
    if (e.target && e.target.id === 'printSeatingPlanBtn') {
        console.log('Yazdır butonuna tıklandı!');
        if (currentSeatingPlan) {
            printSeatingPlan();
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('Seating plan script yüklendi');
    
    // Plan başlığı değiştirildiğinde önizlemeyi güncelle
    const planTitleInput = document.getElementById('seatingPlanTitle');
    if (planTitleInput) {
        planTitleInput.addEventListener('input', function() {
            if (currentSeatingPlan) {
                // Başlığı currentSeatingPlan'da da güncelle
                currentSeatingPlan.title = this.value.trim() || 'Sınıf Oturma Planı';
                
                // Önizlemeyi yeniden render et
                updateSeatingPlanTitle();
            }
        });
    }
});

// Sadece başlığı güncelle (tüm planı yeniden render etmeden)
function updateSeatingPlanTitle() {
    const titleElement = document.querySelector('#seatingPlanPreview h4');
    if (titleElement) {
        const displayTitle = document.getElementById('seatingPlanTitle').value.trim() || currentSeatingPlan.title || 'Sınıf Oturma Planı';
        titleElement.textContent = displayTitle;
    }
}

// Oturma planı oluşturma fonksiyonu
function generateSeatingPlan(deskCount, planTitle) {
    const students = classesByName[currentScheduleClass];
    if (!students || students.length === 0) {
        alert('Öğrenci listesi bulunamadı.');
        return;
    }
    
    // Öğrencileri karıştır
    const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
    
    // Oturma planı oluştur
    currentSeatingPlan = {
        title: planTitle,
        deskCount: deskCount,
        students: shuffledStudents,
        assignments: {}
    };
    
    // Tüm sıralar için boş assignment'lar oluştur
    for (let desk = 1; desk <= deskCount; desk++) {
        currentSeatingPlan.assignments[desk] = {
            left: null,
            right: null
        };
    }
    
    // Öğrencileri sıralara yerleştir (her sıraya 2 öğrenci)
    let studentIndex = 0;
    for (let desk = 1; desk <= deskCount && studentIndex < shuffledStudents.length; desk++) {
        if (studentIndex < shuffledStudents.length) {
            currentSeatingPlan.assignments[desk].left = shuffledStudents[studentIndex++];
        }
        if (studentIndex < shuffledStudents.length) {
            currentSeatingPlan.assignments[desk].right = shuffledStudents[studentIndex++];
        }
    }
    
    console.log('Oturma planı oluşturuldu:', currentSeatingPlan);
    renderSeatingPlan();
    
    // Butonları aktif et
    document.getElementById('shuffleSeatingPlanBtn').disabled = false;
    document.getElementById('printSeatingPlanBtn').disabled = false;
}

// Oturma planını görsel olarak render etme
function renderSeatingPlan() {
    if (!currentSeatingPlan) return;
    
    const previewDiv = document.getElementById('seatingPlanPreview');
    
    // Kullanıcının girdiği başlığı al, yoksa currentSeatingPlan.title'ı kullan
    const displayTitle = document.getElementById('seatingPlanTitle').value.trim() || currentSeatingPlan.title || 'Sınıf Oturma Planı';
    
    let html = `
        <div class="seating-plan">
            <h4 class="text-center mb-4">${displayTitle}</h4>
            <div class="classroom">
                <div class="teacher-area">
                    <div class="teacher-desk">
                        <i class="bi bi-person-circle"></i> ÖĞRETMEN MASASI
                    </div>
                </div>
                <div class="student-desks">
    `;
    
    // Sıraları oluştur
    for (let desk = 1; desk <= currentSeatingPlan.deskCount; desk++) {
        const assignment = currentSeatingPlan.assignments[desk] || { left: null, right: null };
        
        html += `
            <div class="desk-row" data-desk="${desk}">
                <div class="desk-number">${desk}</div>
                <div class="student-seats">
                    <div class="student-seat left ${assignment.left ? 'occupied' : 'empty'}" 
                         data-desk="${desk}" data-position="left">
                        ${assignment.left ? 
                            `<div class="student-name" data-student-id="${assignment.left.student_no}">
                                ${assignment.left.first_name} ${assignment.left.last_name}
                            </div>` : 
                            '<div class="empty-seat">Boş</div>'
                        }
                    </div>
                    <div class="student-seat right ${assignment.right ? 'occupied' : 'empty'}" 
                         data-desk="${desk}" data-position="right">
                        ${assignment.right ? 
                            `<div class="student-name" data-student-id="${assignment.right.student_no}">
                                ${assignment.right.first_name} ${assignment.right.last_name}
                            </div>` : 
                            '<div class="empty-seat">Boş</div>'
                        }
                    </div>
                </div>
            </div>
        `;
    }
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    previewDiv.innerHTML = html;
    
    // Öğrenci yerlerini değiştirme için click event'leri ekle
    addSeatClickEvents();
}

// Öğrenci koltukları için click event'leri ekle
function addSeatClickEvents() {
    document.querySelectorAll('.student-seat').forEach(seat => {
        seat.addEventListener('click', function() {
            const desk = parseInt(this.getAttribute('data-desk'));
            const position = this.getAttribute('data-position');
            
            if (selectedStudent) {
                // Öğrenci seçiliyse, bu koltuğa yerleştir
                moveStudentToSeat(selectedStudent, desk, position);
                clearSelection();
            } else {
                // Öğrenci seçili değilse, bu koltuktan öğrenciyi seç
                const assignment = currentSeatingPlan.assignments[desk];
                if (assignment && assignment[position]) {
                    selectStudent(assignment[position], desk, position);
                }
            }
        });
    });
}

// Öğrenci seçme
function selectStudent(student, desk, position) {
    selectedStudent = {
        student: student,
        originalDesk: desk,
        originalPosition: position
    };
    
    // Seçili öğrenciyi görsel olarak işaretle
    document.querySelectorAll('.student-seat').forEach(seat => {
        seat.classList.remove('selected');
    });
    
    const seatElement = document.querySelector(`[data-desk="${desk}"][data-position="${position}"]`);
    if (seatElement) {
        seatElement.classList.add('selected');
    }
}

// Öğrenciyi başka bir koltuğa taşı
function moveStudentToSeat(selectedStudentInfo, targetDesk, targetPosition) {
    const sourceDesk = selectedStudentInfo.originalDesk;
    const sourcePosition = selectedStudentInfo.originalPosition;
    const student = selectedStudentInfo.student;
    
    // Hedef koltukta zaten bir öğrenci varsa, yer değiştir
    const targetAssignment = currentSeatingPlan.assignments[targetDesk];
    const targetStudent = targetAssignment ? targetAssignment[targetPosition] : null;
    
    // Öğrencileri yerleştir
    if (!currentSeatingPlan.assignments[targetDesk]) {
        currentSeatingPlan.assignments[targetDesk] = { left: null, right: null };
    }
    
    if (!currentSeatingPlan.assignments[sourceDesk]) {
        currentSeatingPlan.assignments[sourceDesk] = { left: null, right: null };
    }
    
    currentSeatingPlan.assignments[targetDesk][targetPosition] = student;
    
    if (targetStudent) {
        // Yer değiştirme
        currentSeatingPlan.assignments[sourceDesk][sourcePosition] = targetStudent;
    } else {
        // Sadece taşıma
        currentSeatingPlan.assignments[sourceDesk][sourcePosition] = null;
    }
    
    // Planı yeniden render et
    renderSeatingPlan();
}

// Seçimi temizle
function clearSelection() {
    selectedStudent = null;
    document.querySelectorAll('.student-seat').forEach(seat => {
        seat.classList.remove('selected');
    });
}

// Oturma planını karıştır
function shuffleSeatingPlan() {
    if (!currentSeatingPlan) return;
    
    // Tüm öğrencileri topla
    const allStudents = [];
    for (let desk = 1; desk <= currentSeatingPlan.deskCount; desk++) {
        const assignment = currentSeatingPlan.assignments[desk];
        if (assignment && assignment.left) allStudents.push(assignment.left);
        if (assignment && assignment.right) allStudents.push(assignment.right);
    }
    
    // Karıştır
    const shuffledStudents = allStudents.sort(() => Math.random() - 0.5);
    
    // Tüm sıralar için boş assignment'lar oluştur
    currentSeatingPlan.assignments = {};
    for (let desk = 1; desk <= currentSeatingPlan.deskCount; desk++) {
        currentSeatingPlan.assignments[desk] = {
            left: null,
            right: null
        };
    }
    
    // Öğrencileri yeniden yerleştir
    let studentIndex = 0;
    for (let desk = 1; desk <= currentSeatingPlan.deskCount && studentIndex < shuffledStudents.length; desk++) {
        if (studentIndex < shuffledStudents.length) {
            currentSeatingPlan.assignments[desk].left = shuffledStudents[studentIndex++];
        }
        if (studentIndex < shuffledStudents.length) {
            currentSeatingPlan.assignments[desk].right = shuffledStudents[studentIndex++];
        }
    }
    
    renderSeatingPlan();
}

// Oturma planını yazdır
function printSeatingPlan() {
    if (!currentSeatingPlan) return;
    
    // Kullanıcıdan yazdırma başlığını al
    showPrintTitleModal();
}

// Yazdırma başlığı modal'ını göster
function showPrintTitleModal() {
    // Mevcut başlığı al
    const currentTitle = document.getElementById('seatingPlanTitle').value || currentSeatingPlan.title || 'Sınıf Oturma Planı';
    
    // Modal HTML'ini oluştur
    const modalHtml = `
        <div class="modal fade" id="printTitleModal" tabindex="-1" aria-labelledby="printTitleModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header" style="background-color: #FF5722; color: white;">
                        <h5 class="modal-title" id="printTitleModalLabel">Yazdırma Başlığını Düzenle</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat" style="filter: invert(1)"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="printTitle" class="form-label">Başlık</label>
                            <input type="text" class="form-control" id="printTitle" value="${currentTitle}" placeholder="Yazdırma başlığını girin">
                        </div>
                        <div class="mb-3">
                            <small class="text-muted">Bu başlık yazdırılan sayfada görünecektir.</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                        <button type="button" class="btn btn-success" id="confirmPrintBtn">Yazdır</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Mevcut modal'ı kaldır (varsa)
    const existingModal = document.getElementById('printTitleModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Yeni modal'ı ekle
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('printTitleModal'));
    modal.show();
    
    // Confirm butonuna event listener ekle
    document.getElementById('confirmPrintBtn').addEventListener('click', function() {
        const printTitle = document.getElementById('printTitle').value.trim() || 'Sınıf Oturma Planı';
        modal.hide();
        
        // Modal'ı DOM'dan kaldır
        setTimeout(() => {
            document.getElementById('printTitleModal').remove();
        }, 500);
        
        // Gerçek yazdırma işlemini başlat
        executePrint(printTitle);
    });
    
    // Input alanına odaklan ve Enter tuşu desteği ekle
    setTimeout(() => {
        const printTitleInput = document.getElementById('printTitle');
        if (printTitleInput) {
            printTitleInput.focus();
            printTitleInput.select();
            
            // Enter tuşuna basıldığında yazdır
            printTitleInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    document.getElementById('confirmPrintBtn').click();
                }
            });
        }
    }, 500);
}

// Gerçek yazdırma işlemini gerçekleştir
function executePrint(printTitle) {
    // Modal'daki önizlemeyi al
    const previewDiv = document.getElementById('seatingPlanPreview');
    if (!previewDiv) return;
    
    // Seçilen sütun sayısını al
    const printColumns = document.getElementById('printColumns').value;
    
    // Yazdırma alanı oluştur
    const printSection = document.createElement('div');
    printSection.id = 'seating-plan-print-section';
    printSection.innerHTML = previewDiv.innerHTML;
    printSection.style.display = 'none';
    document.body.appendChild(printSection);
    
    // Yazdırma için CSS sınıfı ekle
    printSection.classList.add('print-active');
    
    // Sütun sayısına göre grid sınıfı ekle
    const studentDesks = printSection.querySelector('.student-desks');
    if (studentDesks) {
        // Önceki sınıfları temizle
        studentDesks.className = studentDesks.className.replace(/desk-count-\d+|print-columns-\d+|print-columns-auto/g, '');
        
        if (printColumns === 'auto') {
            // Otomatik: sıra sayısına göre
            studentDesks.classList.add(`desk-count-${currentSeatingPlan.deskCount}`);
        } else {
            // Manuel seçim
            studentDesks.classList.add(`print-columns-${printColumns}`);
        }
    }
    
    // Başlığı güncelle - Kullanıcının girdiği başlığı kullan
    const titleElement = printSection.querySelector('h4');
    if (titleElement) {
        titleElement.textContent = printTitle;
    }
    
    // CSS kontrolü için kısa bir gecikme
    setTimeout(() => {
        printSection.style.display = 'block';
        
        // Yazdırma işlemini başlat
        setTimeout(() => {
            window.print();
            
            // Yazdırma işlemi tamamlandıktan sonra temizle
            setTimeout(() => {
                printSection.remove();
            }, 1000);
        }, 300);
    }, 100);
}

// Yazdırılabilir oturma planı HTML'i oluştur
function generatePrintableSeatingPlan() {
    if (!currentSeatingPlan) return '';
    
    // Sınıf adını başlıktan çıkar
    const className = currentScheduleClass || 'SINIF';
    
    let html = `
        <div class="seating-plan-print">
            <div class="print-header">
                <div class="print-photo-area">
                    <div class="print-photo-placeholder"></div>
                </div>
                <div class="print-title-area">
                    <h1 class="print-main-title">${className} OTURMA PLANI</h1>
                </div>
                <div class="print-teacher-area">
                    <div class="print-teacher-desk">ÖĞRETMEN MASASI</div>
                </div>
            </div>
            <div class="print-classroom-grid" data-desk-count="${currentSeatingPlan.deskCount}">
    `;
    
    // Tüm sıraları sırayla oluştur
    for (let desk = 1; desk <= currentSeatingPlan.deskCount; desk++) {
        const assignment = currentSeatingPlan.assignments[desk];
        html += `
            <div class="print-desk-unit">
                <div class="print-desk-header">${desk}</div>
                <div class="print-desk-seats">
                    <div class="print-seat">
                        ${assignment && assignment.left ? 
                            assignment.left.first_name + ' ' + assignment.left.last_name : 
                            ''
                        }
                    </div>
                    <div class="print-seat">
                        ${assignment && assignment.right ? 
                            assignment.right.first_name + ' ' + assignment.right.last_name : 
                            ''
                        }
                    </div>
                </div>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
} 