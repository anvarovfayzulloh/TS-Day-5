"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//@ts-ignore
const $overlay = document.querySelector("#overlay");
//@ts-ignore
const $incomeBtn = document.querySelector("#incomeBtn");
//@ts-ignore
const $expenseBtn = document.querySelector("#expenseBtn");
//@ts-ignore
const $closeBtn = document.querySelector("#closeBtn");
//@ts-ignore
const $transactionForm = document.querySelector("#transactionForm");
//@ts-ignore
const $displayIncomes = document.querySelector("#displayIncomes");
//@ts-ignore
const $displayExpenses = document.querySelector("#displayExpenses");
//@ts-ignore
const $transactionList = document.querySelector("#transactionList");
const url = new URL(location.href);
const INCOMES = JSON.parse(localStorage.getItem("incomes")) || [];
const EXPENSES = JSON.parse(localStorage.getItem("expences")) || [];
String.prototype.seperateCurrency = function () {
    return this.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
const getCurrentQuery = () => {
    return new URLSearchParams(location.search).get('modal') || "";
};
let totalIncome = 0;
let totalExpense = 0;
const checkBalance = () => {
    totalIncome = INCOMES.reduce((acc, cur) => acc + cur.transactionAmount, 0);
    totalExpense = EXPENSES.reduce((acc, cur) => acc + cur.transactionAmount, 0);
    $displayIncomes.innerHTML = `${(totalIncome - totalExpense).toString().seperateCurrency()}`;
    $displayExpenses.innerHTML = `${(totalExpense).toString().seperateCurrency()}`;
};
checkBalance();
//@ts-ignore
let myChartInstance = null;
const renderChart = () => {
    if (myChartInstance) {
        myChartInstance.destroy();
    }
    //@ts-ignore
    const $myChart = document.querySelector("#myChart");
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
renderChart();
const checkModalOpen = () => {
    let openModal = getCurrentQuery();
    let $select = $transactionForm.querySelector("select");
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
    transactionName;
    transactionType;
    transactionAmount;
    type;
    date;
    constructor(transactionName, transactionAmount, transactionType, type) {
        this.transactionName = transactionName;
        this.transactionType = transactionType;
        this.transactionAmount = transactionAmount;
        this.type = type;
        this.date = new Date().getTime();
    }
}
const renderTransactions = () => {
    // @ts-ignore
    const $transactionTableBody = document.querySelector("#transactionTableBody");
    $transactionTableBody.innerHTML = "";
    INCOMES.forEach((income) => {
        $transactionTableBody.innerHTML += `
            <tr class="transactionTable" >
                <td>${income.transactionName}</td>
                <td>${income.transactionAmount.toString().seperateCurrency()}</td>
                <td>Income</td>
                <td>${new Date(income.date).toLocaleDateString()}</td>
            </tr>
        `;
    });
    EXPENSES.forEach((expense) => {
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
renderTransactions();
const createNewTransaction = (e) => {
    e.preventDefault();
    const inputs = Array.from($transactionForm.querySelectorAll("input, select"));
    const values = inputs.map((input) => {
        if (input.type === "number") {
            return +input.value;
        }
        return input.value ? input.value : undefined;
    });
    if (values.slice(0, getCurrentQuery() === "income" ? -1 : undefined).every((value) => typeof value === "string" ? value?.trim().length > 0 : value && value > 0)) {
        const newTransaction = new Transaction(...values, getCurrentQuery());
        if (getCurrentQuery() === "income") {
            INCOMES.push(newTransaction);
            localStorage.setItem("incomes", JSON.stringify(INCOMES));
        }
        else {
            EXPENSES.push(newTransaction);
            localStorage.setItem("expences", JSON.stringify(EXPENSES));
        }
        window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
        checkModalOpen();
        checkBalance();
        inputs.forEach((input) => {
            input.value = "";
        });
        renderChart();
        renderTransactions();
    }
    else {
        alert("Alert");
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
