let salary = 0;
        let expenses = [];

        function init() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('expenseDate').value = today;
            
            loadData();
            updateDisplay();
        }

        function toggleOtherCategory() {
            const category = document.getElementById('expenseCategory').value;
            const otherGroup = document.getElementById('otherCategoryGroup');
            
            if (category === 'Other') {
                otherGroup.style.display = 'block';
            } else {
                otherGroup.style.display = 'none';
                document.getElementById('otherCategory').value = '';
            }
        }

        function loadData() {
            try {
                const savedSalary = localStorage.getItem('salary');
                const savedExpenses = localStorage.getItem('expenses');
                
                if (savedSalary) {
                    salary = parseFloat(savedSalary);
                    document.getElementById('salary').value = salary;
                }
                
                if (savedExpenses) {
                    expenses = JSON.parse(savedExpenses);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                showAlert('Error loading data', 'error');
            }
        }

        function saveData() {
            try {
                localStorage.setItem('salary', salary.toString());
                localStorage.setItem('expenses', JSON.stringify(expenses));
            } catch (error) {
                console.error('Error saving data:', error);
                showAlert('Error saving data', 'error');
            }
        }

        function saveSalary() {
            const salaryInput = document.getElementById('salary').value;
            if (salaryInput && parseFloat(salaryInput) > 0) {
                salary = parseFloat(salaryInput);
                saveData();
                updateDisplay();
                showAlert('Salary saved successfully! ✅', 'success');
            } else {
                showAlert('Please enter a valid salary', 'error');
            }
        }

        function addExpense() {
            const date = document.getElementById('expenseDate').value;
            const categorySelect = document.getElementById('expenseCategory').value;
            const otherCategory = document.getElementById('otherCategory').value.trim();
            const desc = document.getElementById('expenseDesc').value.trim();
            const amount = document.getElementById('expenseAmount').value;

            if (!date) {
                showAlert('Please select a date', 'error');
                return;
            }

            if (!categorySelect) {
                showAlert('Please select a category', 'error');
                return;
            }

            let category = categorySelect;
            if (categorySelect === 'Other') {
                if (!otherCategory) {
                    showAlert('Please specify the other category', 'error');
                    return;
                }
                category = otherCategory;
            }

            if (!desc) {
                showAlert('Please enter expense description', 'error');
                return;
            }

            if (!amount || parseFloat(amount) <= 0) {
                showAlert('Please enter a valid amount', 'error');
                return;
            }

            const expense = {
                id: Date.now(),
                date: date,
                category: category,
                description: desc,
                amount: parseFloat(amount)
            };

            expenses.push(expense);
            saveData();
            updateDisplay();

            document.getElementById('expenseCategory').value = '';
            document.getElementById('otherCategory').value = '';
            document.getElementById('expenseDesc').value = '';
            document.getElementById('expenseAmount').value = '';
            document.getElementById('otherCategoryGroup').style.display = 'none';
            
            showAlert('Expense added successfully! ✅', 'success');
        }

        function deleteExpense(id) {
            if (confirm('Are you sure you want to delete this expense?')) {
                expenses = expenses.filter(exp => exp.id !== id);
                saveData();
                updateDisplay();
                showAlert('Expense deleted successfully', 'success');
            }
        }

        function updateDisplay() {
            const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const remaining = salary - total;

            const totalElement = document.getElementById('totalExpenses');
            const remainingElement = document.getElementById('remaining');

            totalElement.textContent = total.toFixed(2);
            remainingElement.textContent = remaining.toFixed(2);

            remainingElement.classList.remove('positive', 'negative');
            if (remaining < 0) {
                remainingElement.classList.add('negative');
            } else if (remaining > 0) {
                remainingElement.classList.add('positive');
            }

            const expensesList = document.getElementById('expensesList');
            
            if (expenses.length === 0) {
                expensesList.innerHTML = '<div class="no-expenses">No expenses recorded yet</div>';
                return;
            }

            const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            expensesList.innerHTML = sortedExpenses.map(exp => `
                <div class="expense-item">
                    <div class="expense-info">
                        <div class="expense-date">${formatDate(exp.date)}</div>
                        <div class="expense-category">${escapeHtml(exp.category || 'Uncategorized')}</div>
                        <div class="expense-desc">${escapeHtml(exp.description)}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="expense-amount">-${exp.amount.toFixed(2)}</div>
                        <button class="btn btn-delete" onclick="deleteExpense(${exp.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function formatDate(dateStr) {
            const date = new Date(dateStr + 'T00:00:00');
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        }

        function downloadPDF() {
            if (typeof window.jspdf === 'undefined') {
                showAlert('Loading PDF library...', 'error');
                return;
            }

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                const pageWidth = doc.internal.pageSize.width;
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(20);
                doc.text("Monthly Expense Report", pageWidth / 2, 20, { align: "center" });
                
                doc.setFontSize(12);
                doc.setFont("helvetica", "normal");
                doc.text(`Report Date: ${new Date().toLocaleDateString('en-US')}`, pageWidth / 2, 30, { align: "center" });
                
                doc.setDrawColor(74, 158, 255);
                doc.setLineWidth(0.5);
                doc.line(20, 35, pageWidth - 20, 35);

                let yPos = 50;
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                doc.text("Financial Summary", 20, yPos);
                yPos += 10;
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(12);
                doc.text(`Monthly Salary: ${salary.toFixed(2)}`, 20, yPos);
                yPos += 8;
                
                const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
                doc.text(`Total Expenses: ${total.toFixed(2)}`, 20, yPos);
                yPos += 8;
                
                const remaining = salary - total;
                doc.setFont("helvetica", "bold");
                doc.text(`Remaining Balance: ${remaining.toFixed(2)}`, 20, yPos);
                yPos += 15;

                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                doc.text("Expense Details", 20, yPos);
                yPos += 10;

                if (expenses.length === 0) {
                    doc.setFont("helvetica", "italic");
                    doc.setFontSize(12);
                    doc.text("No expenses recorded", 20, yPos);
                } else {
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(10);
                    
                    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    sortedExpenses.forEach((exp, index) => {
                        if (yPos > 270) {
                            doc.addPage();
                            yPos = 20;
                        }
                        
                        const categoryText = exp.category ? `[${exp.category}] ` : '';
                        doc.text(`${index + 1}. ${exp.date} - ${categoryText}${exp.description}`, 20, yPos);
                        doc.text(`Amount: ${exp.amount.toFixed(2)}`, pageWidth - 60, yPos);
                        yPos += 7;
                    });
                }

                doc.setFontSize(8);
                doc.setFont("helvetica", "italic");
                const footerText = "Generated by Daily Expense Manager";
                doc.text(footerText, pageWidth / 2, doc.internal.pageSize.height - 10, { align: "center" });

                doc.save(`expense_report_${new Date().toISOString().split('T')[0]}.pdf`);
                showAlert('Report downloaded successfully! ', 'success');
            } catch (error) {
                console.error('Error creating PDF:', error);
                showAlert('Error creating report', 'error');
            }
        }

        function clearAllData() {
            if (confirm('Are you sure you want to delete all data? This action cannot be undone!')) {
                localStorage.clear();
                salary = 0;
                expenses = [];
                document.getElementById('salary').value = '';
                updateDisplay();
                showAlert('All data cleared successfully!', 'success');
            }
        }

        function showAlert(message, type = 'success') {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert ${type}`;
            alertDiv.textContent = message;
            document.body.appendChild(alertDiv);

            setTimeout(() => {
                alertDiv.style.animation = 'slideDown 0.3s ease reverse';
                setTimeout(() => {
                    document.body.removeChild(alertDiv);
                }, 300);
            }, 3000);
        }

        init();