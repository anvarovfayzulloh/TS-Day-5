//@ts-ignore
const $overlay = document.querySelector("#overlay") as HTMLDivElement;
//@ts-ignore
const $incomeBtn = document.querySelector("#incomeBtn") as HTMLButtonElement;
//@ts-ignore
const $expenseBtn = document.querySelector("#expenseBtn") as HTMLButtonElement;
//@ts-ignore
const $closeBtn = document.querySelector("#closeBtn") as HTMLButtonElement;
//@ts-ignore
const $transactionForm = document.querySelector("#transactionForm") as HTMLFormElement;
//@ts-ignore
const $displayIncomes = document.querySelector("#displayIncomes") as HTMLElement;
//@ts-ignore
const $displayExpenses = document.querySelector("#displayExpenses") as HTMLElement;
//@ts-ignore
const $transactionList = document.querySelector("#transactionList") as HTMLDivElement;
//@ts-ignore
const $clearBtn = document.querySelector("#clearBtn") as HTMLButtonElement;

const url = new URL(location.href);
const INCOMES = JSON.parse(localStorage.getItem("incomes") as string) || [];
const EXPENSES = JSON.parse(localStorage.getItem("expenses") as string) || [];

type Tincome = {
    transactionName: string;
    transactionType: string | undefined;
    transactionAmount: number;
    type: string;
    date: number;
};

$clearBtn.addEventListener("click", () => {
    localStorage.clear();
    location.reload();
})

export {};

declare global {
    interface String {
        seperateCurrency(): string;
    }
}

String.prototype.seperateCurrency = function (): string {
    return this.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getCurrentQuery = () => {
    return new URLSearchParams(location.search).get('modal') || "";
};

let totalIncome = 0;
let totalExpense = 0;

const checkBalance = () => {
    totalIncome = INCOMES.reduce((acc: number, cur: Tincome) => acc + cur.transactionAmount, 0);
    totalExpense = EXPENSES.reduce((acc: number, cur: Tincome) => acc + cur.transactionAmount, 0);

    $displayIncomes.innerHTML = `${(totalIncome - totalExpense).toString().seperateCurrency()} UZS`;
    $displayExpenses.innerHTML = `${(totalExpense).toString().seperateCurrency()} UZS`;
};

checkBalance();

//@ts-ignore
let myChartInstance: Chart | null = null;
//@ts-ignore
let myBarChartInstance: Chart | null = null;

const renderChart = () => {
//@ts-ignore
    const $myChart = document.querySelector("#myChart") as HTMLCanvasElement;

    if (myChartInstance) {
        myChartInstance.destroy();
    }

//@ts-ignore
    myChartInstance = new Chart($myChart, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [totalIncome - totalExpense, totalExpense],
                backgroundColor: ['#4CAF50', '#F44336'],
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
            }
        }
    });
};

const getTopCategories = () => {
    const categoryTotals: { [key: string]: number } = {};

    EXPENSES.forEach((expense: Tincome) => {
        const { transactionType, transactionAmount } = expense;

        if (transactionType) {
            if (!categoryTotals[transactionType]) {
                categoryTotals[transactionType] = 0;
            }
            categoryTotals[transactionType] += transactionAmount;
        }
    });

    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return sortedCategories;
};

const renderBarChart = () => {
    if (myBarChartInstance) {
        myBarChartInstance.destroy();
    }

    const topCategories = getTopCategories();
    const labels = topCategories.map(([type]) => type);
    const data = topCategories.map(([_, total]) => total);

//@ts-ignore
    const $myBarChart = document.querySelector("#myBarChart") as HTMLCanvasElement;
//@ts-ignore
    myBarChartInstance = new Chart($myBarChart, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Expenses by Category',
                data: data,
                backgroundColor: '#F44336',
                borderColor: '#D32F2F',
                borderWidth: 1
            }],
        },
        options: {
            // responsive: false,
            // scales: {
            //     y: {
            //         beginAtZero: true
            //     }
            // }
        }
    });
};

renderChart();
renderBarChart();

const checkModalOpen = () => {
    let openModal = getCurrentQuery();
    let $select = $transactionForm.querySelector("select") as HTMLSelectElement;
    if (openModal === "income") {
        $overlay.classList.remove("hidden");
        $select.classList.add("hidden");
    }
    else if (openModal === "expense") { 
        $overlay.classList.remove("hidden");
        $select.classList.remove("hidden");
    }
    else {
        $overlay.classList.add("hidden");
    }
};

class Transaction {
    transactionName: string;
    transactionType: string | undefined;
    transactionAmount: number;
    type: string;
    date: number;
    constructor(transactionName: string, transactionAmount: number, transactionType: string | undefined, type: string) {
        this.transactionName = transactionName;
        this.transactionType = transactionType;
        this.transactionAmount = transactionAmount;
        this.type = type;
        this.date = new Date().getTime();
    }
}

const renderTransactions = () => {
//@ts-ignore
    const $transactionTableBody = document.querySelector("#transactionTableBody") as HTMLTableSectionElement;
    $transactionTableBody.innerHTML = "";
    INCOMES.forEach((income: Tincome) => {
        $transactionTableBody.innerHTML += `
                <tr class="transactionTable transactionIncome">
                    <td>${income.transactionName}</td>
                    <td>${income.transactionAmount.toString().seperateCurrency()} UZS</td>
                    <td>Income</td>
                    <td>${new Date(income.date).toLocaleDateString()}</td>
                </tr>
            `;
    });

    EXPENSES.forEach((expense: Tincome) => {
        $transactionTableBody.innerHTML += `
                <tr class="transactionTable transactionExpense">
                    <td>${expense.transactionName}</td>
                    <td>${expense.transactionAmount.toString().seperateCurrency()} UZS</td>
                    <td>Expense</td>
                    <td>${new Date(expense.date).toLocaleDateString()}</td>
                </tr>
            `;
    });
};

renderTransactions();

const createNewTransaction = (e: Event) => {
    e.preventDefault();

    const inputs = Array.from($transactionForm.querySelectorAll("input, select")) as HTMLInputElement[];
    const values: (string | number | undefined)[] = inputs.map((input) => {
        if (input.type === "number") {
            return +input.value;
        }
        return input.value ? input.value : undefined;
    });
    
    if (values.slice(0, getCurrentQuery() === "income" ? -1 : undefined).every((value) => typeof value === "string" ? value?.trim().length > 0 : value && value > 0)) {
        const newTransaction = new Transaction(...values as [string, number, string | undefined], getCurrentQuery());
        
        if (getCurrentQuery() === "income") {
            INCOMES.push(newTransaction);
            localStorage.setItem("incomes", JSON.stringify(INCOMES));
        } else {
            EXPENSES.push(newTransaction);
            localStorage.setItem("expenses", JSON.stringify(EXPENSES));
        }
        
        window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
        checkModalOpen();
        checkBalance();
        
        inputs.forEach((input) => {
            input.value = "";
        });
        
        renderChart();
        renderBarChart();
        renderTransactions();
    } else {
        alert("Please fill in all fields correctly!");
    }
};

$incomeBtn.addEventListener("click", () => {
    url.searchParams.set("modal", "income");
    window.history.pushState({ path: location.href + "?" + url.searchParams }, "", location.href + "?" + url.searchParams);
    checkModalOpen();
});

$expenseBtn.addEventListener("click", () => {
    url.searchParams.set("modal", "expense");
    window.history.pushState({ path: location.href + "?" + url.searchParams }, "", location.href + "?" + url.searchParams);
    checkModalOpen();
});

$closeBtn.addEventListener("click", () => {
    window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
    checkModalOpen();
});

checkModalOpen();

$transactionForm.addEventListener("submit", createNewTransaction);
