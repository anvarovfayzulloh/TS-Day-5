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

const url = new URL(location.href);

const INCOMES = JSON.parse(localStorage.getItem("incomes") as string) || []
const EXPENSES = JSON.parse(localStorage.getItem("expences") as string) || []

type Tincome = {
    transactionName: string
    transactionType: string | undefined
    transactionAmount: number
    type: string
    date: number
}

export { };

declare global {
    interface String {
        seperateCurrency(): string;
    }
}

String.prototype.seperateCurrency = function (): string {
    return this.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};


const getCurrentQuery = () => {
    return new URLSearchParams(location.search).get('modal') || "" as string
}

let totalIncome = 0;
let totalExpense = 0;

const checkBalance = () => {
    totalIncome = INCOMES.reduce((acc: number, cur: Tincome) => acc + cur.transactionAmount, 0);
    totalExpense = EXPENSES.reduce((acc: number, cur: Tincome) => acc + cur.transactionAmount, 0);

    $displayIncomes.innerHTML = `${(totalIncome - totalExpense).toString().seperateCurrency()}`;
    $displayExpenses.innerHTML = `${(totalExpense).toString().seperateCurrency()}`;
}
checkBalance()

//@ts-ignore
let myChartInstance: Chart | null = null;

const renderChart = () => {
    if (myChartInstance) {
        myChartInstance.destroy();
    }

//@ts-ignore
    const $myChart = document.querySelector("#myChart") as HTMLCanvasElement;

//@ts-ignore
    myChartInstance = new Chart($myChart, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [`${totalIncome - totalExpense}`, totalExpense],
                backgroundColor: ['#4CAF50', '#F44336'],
            }],
        },
        options: {
            responsive: true,
            elements: {
                arc: {
                    borderWidth: 1,
                }
            }
        }
    });
};

renderChart()

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
        $overlay.classList.add("hidden")
    }
}

class Transaction {
    transactionName: string
    transactionType: string | undefined
    transactionAmount: number
    type: string
    date: number
    constructor(transactionName: string, transactionAmount: number, transactionType: string | undefined, type: string) {
        this.transactionName = transactionName
        this.transactionType = transactionType
        this.transactionAmount = transactionAmount
        this.type = type
        this.date = new Date().getTime()
    }
}

const renderTransactions = () => {
    // @ts-ignore
    const $transactionTableBody = document.querySelector("#transactionTableBody") as HTMLTableSectionElement;
    $transactionTableBody.innerHTML = "";

    INCOMES.forEach((income: Tincome) => {
        $transactionTableBody.innerHTML += `
            <tr class="transactionTable" >
                <td>${income.transactionName}</td>
                <td>${income.transactionAmount.toString().seperateCurrency()}</td>
                <td>Income</td>
                <td>${new Date(income.date).toLocaleDateString()}</td>
            </tr>
        `;
    });

    EXPENSES.forEach((expense: Tincome) => {
        $transactionTableBody.innerHTML += `
            <tr class="transactionTable" >
                <td>${expense.transactionName}</td>
                <td>${expense.transactionAmount.toString().seperateCurrency()}</td>
                <td>Expense</td>
                <td>${new Date(expense.date).toLocaleDateString()}</td>
            </tr>
        `;
    });
};
renderTransactions()


const createNewTransaction = (e: Event) => {
    e.preventDefault();

    const inputs = Array.from($transactionForm.querySelectorAll("input, select")) as HTMLInputElement[]
    const values: (string | number | undefined)[] = inputs.map((input) => {
        if (input.type === "number") {
            return +input.value
        }
        return input.value ? input.value : undefined
    })
    if (values.slice(0, getCurrentQuery() === "income" ? -1 : undefined).every((value) => typeof value === "string" ? value?.trim().length > 0 : value && value > 0)) {
        const newTransaction = new Transaction(...values as [string, number, string | undefined], getCurrentQuery())
        if (getCurrentQuery() === "income") {
            INCOMES.push(newTransaction)
            localStorage.setItem("incomes", JSON.stringify(INCOMES))
        }
        else {
            EXPENSES.push(newTransaction)
            localStorage.setItem("expences", JSON.stringify(EXPENSES))
        }
        window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
        checkModalOpen()
        checkBalance()
        inputs.forEach((input) => {
            input.value = "";
        });
        renderChart();
        renderTransactions()
}
    else {
        alert("Alert")
    }
}

$incomeBtn.addEventListener("click", () => {
    url.searchParams.set("modal", "income")
    window.history.pushState({ path: location.href + "?" + url.searchParams }, "", location.href + "?" + url.searchParams);
    checkModalOpen()
})

$expenseBtn.addEventListener("click", () => {
    url.searchParams.set("modal", "expense")
    window.history.pushState({ path: location.href + "?" + url.searchParams }, "", location.href + "?" + url.searchParams);
    checkModalOpen()
})

$closeBtn.addEventListener("click", () => {
    window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
    checkModalOpen()
})

checkModalOpen()

$transactionForm.addEventListener("submit", createNewTransaction);