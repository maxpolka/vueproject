let eventBus = new Vue();

Vue.component("mainlist", {
    template: `
        <div class="column_list">
        <div class="column" v-for="(column, index) in columns" :key="column">
            <h2>{{ column }}</h2>
            <card
              :key="'card-' + column + '-' + cardIndex"
              :column="column"
              :cardIndex="cardIndex"
              :cards="columnCards[column]"
              :columnCards="columnCards"
              @update-cards="updateCards"
              @move-card="moveCard"
            ></card>
            <input
              v-if="column == 'one'"
              :id="'cardname-' + column"
              v-model="newCardNames[column]"
              placeholder="Name for card"
              class="cardname"
            >
            <button
              v-if="column == 'one'"
              v-on:click="addToCard(column)"
            >
              create
            </button>
            <button v-on:click="resetAll" v-if="column == 'one'">clear all</button>
        </div>
    </div>
        `,

    data() {
        return {
            columns: ["one", "two", "three"],
            columnCards: {
                one: [],
                two: [],
                three: [],
            },
            newCardNames: ["", "", ""],
            locked: false,
            cardIndex: 0,
        };
    },
    mounted() {
        this.loadSavedData();
    },
    methods: {
        loadSavedData() {
            const savedColumns = JSON.parse(localStorage.getItem("columns"));
            const savedColumnCards = JSON.parse(localStorage.getItem("columnCards"));
            const savedNewCardNames = JSON.parse(
                localStorage.getItem("newCardNames")
            );
            if (savedNewCardNames) {
                this.newCardNames = savedNewCardNames;
            } else {
                this.columns.forEach((column) => {
                    this.newCardNames[column] = "";
                });
            }
            const savedLocked = JSON.parse(localStorage.getItem("locked"));
            if (savedColumns) {
                this.columns = savedColumns;
            }
            if (savedColumnCards) {
                this.columnCards = savedColumnCards;
            }
            if (savedNewCardNames) {
                this.newCardNames = savedNewCardNames;
            }
            if (savedLocked !== null) {
                this.locked = savedLocked;
            }
        },
        addToCard(column) {
            const cardName = this.newCardNames[column];
            if (
                cardName &&
                this.columnCards[column].length <
                (column === "one" ? 3 : column === "two" ? 5 : Infinity)
            ) {
                const newCard = {
                    title: cardName,
                    checks: [],
                    completedTime: null,
                    checkname: "",
                };
                Vue.set(
                    this.columnCards[column],
                    this.columnCards[column].length,
                    newCard
                );
                this.newCardNames[column] = "";
            }
        },

        resetAll() {
            localStorage.clear();
            location.reload();
        },
        updateCards(column) {
            localStorage.setItem("columnCards", JSON.stringify(this.columnCards));
        },
        moveCard(payload) {
            {
                const cardToMove = this.columnCards[payload.fromColumn].splice(
                    payload.cardIndex,
                    1
                )[0];
                this.columnCards[payload.toColumn].push(cardToMove);
                this.updateCards(payload.toColumn);
                this.updateCards(payload.fromColumn);

                if (payload.toColumn === "two" && this.columnCards["two"].length >= 5) {
                    {
                        this.lockFirstColumn();
                    }
                } else if (
                    payload.fromColumn === "two" &&
                    this.columnCards["two"].length < 5
                ) {
                    {
                        this.unlockFirstColumn();
                    }
                }
            }
        },
        lockFirstColumn() {
            if (
                this.columnCards["one"].some(
                    (card) =>
                        card.checks.filter((check) => check.enable).length /
                        card.checks.length >=
                        0.5
                )
            ) {
                this.locked = true;
                this.columnCards["one"].forEach((card) => {
                    card.checks.forEach((check) => {
                        check.disabled = true;
                    });
                });
                localStorage.setItem("locked", JSON.stringify(this.locked));
            }
        },

        unlockFirstColumn() {
            {
                this.locked = false;
                this.columnCards["one"].forEach((card) => {
                    {
                        card.checks.forEach((check) => {
                            {
                                check.disabled = false;
                            }
                        });
                    }
                });
                localStorage.setItem("locked", JSON.stringify(this.locked));
            }

            // Перемещение карточек, у которых отмечено больше половины чекбоксов, во второй столбец
            const cardsToMove = this.columnCards["one"].filter((card) => {
                const completedChecks = card.checks.filter((check) => check.enable).length;
                const totalChecks = card.checks.length;
                return completedChecks / totalChecks > 0.5;
            });

            cardsToMove.forEach((card) => {
                this.moveToNextColumn("one", card);
            });
        },
        moveToNextColumn(columnName, card) {
            const currentColumnIndex = this.columns.indexOf(columnName);
            const nextColumn = this.columns[currentColumnIndex + 1];

            if (
                nextColumn &&
                this.columnCards[nextColumn].length <
                (nextColumn === "two" ? 5 : Infinity)
            ) {
                this.columnCards[columnName] = this.columnCards[columnName].filter(
                    (c) => c !== card
                );
                this.columnCards[nextColumn].push(card);

                if (nextColumn === "two" && this.columnCards[nextColumn].length === 5) {
                    this.lockFirstColumn();
                }

                this.updateCards(columnName);
                this.updateCards(nextColumn);

                // Проверка, если карточка перемещена во второй столбец и у нее отмечено больше половины чекбоксов
                if (nextColumn === "two" && card.checks.filter((check) => check.enable).length / card.checks.length > 0.5) {
                    this.lockFirstColumn();
                }
            }
        },
    },
    watch: {
        columnCards: {
            handler() {
                localStorage.setItem("columnCards", JSON.stringify(this.columnCards));
            },
            deep: true,
        },
    },
});

Vue.component("card", {
    props: {
        column: String,
        cardIndex: Number,
        cards: Array,
        columnCards: Object,
    },
    computed: {
        isCheckDisabled() {
            return (
                this.cards[this.cardIndex].checks.length < 3 ||
                (this.column === "one" && this.$parent.locked)
            );
        },
    },
    template: `
          <div>
            <div class="card" v-for="(card, cardIndex) in cards">
              <h3>{{ card.title }}</h3>
              <ul class="list">
                <li class="list-item" v-for="(check, index) in card.checks" :key="index">
                <input type="checkbox" class="checkbox" :disabled="check.disabled" v-model="check.enable" @change="checkIfMovable(card, cardIndex)">{{ check.name }}
                </li>
              </ul>
              <div v-if="card.completedTime">Completed at: {{ card.completedTime }}</div>
              <input v-if="column == 'one'" v-model="card.checkname" placeholder="Name for check" class="checkname">
              <button v-on:click="addToCheck(cardIndex)" v-if="column == 'one'">create</button>
            </div>
          </div>
        `,
    methods: {
        addToCheck(cardIndex) {
            const card = this.cards[cardIndex];
            if (card.checkname && card.checks.length < 5) {
                card.checks.push({
                    name: card.checkname,
                    enable: false,
                    disabled: card.checks.length < 2,
                });
                card.checkname = "";
                this.$emit("update-cards", this.column);

                if (card.checks.length >= 3) {
                    card.checks.forEach((check) => {
                        check.disabled = false;
                    });
                }
            }
        },
        checkIfMovable(card, cardIndex) {
            const completedChecks = card.checks.filter(
                (check) => check.enable
            ).length;
            const totalChecks = card.checks.length;
            if (completedChecks === totalChecks) {
                if (!card.completedTime) {
                    if (this.cards[cardIndex] && this.cards[cardIndex].checks) {
                        this.cards[cardIndex].checks.forEach((check) => {
                            if (check.enable) {
                                check.disabled = true;
                            }
                        });
                    }
                    this.$set(card, "completedTime", new Date().toLocaleString());
                }
                Vue.nextTick(() => {
                    this.$emit("move-card", {
                        fromColumn: this.column,
                        cardIndex: cardIndex,
                        toColumn: "three",
                    });
                    if (this.column === "two") {
                        this.$parent.unlockFirstColumn();
                    }
                });
            } else if (
                this.column === "one" &&
                completedChecks / totalChecks >= 0.5
            ) {
                if (this.$parent.columnCards["two"].length === 5) {
                    this.$parent.lockFirstColumn();
                } else {
                    if (this.cards[cardIndex] && this.cards[cardIndex].checks) {
                        this.cards[cardIndex].checks.forEach((check) => {
                            if (check.enable) {
                                check.disabled = true;
                            }
                        });
                    }
                    Vue.nextTick(() => {
                        this.$emit("move-card", {
                            fromColumn: this.column,
                            cardIndex: cardIndex,
                            toColumn: "two",
                        });
                    });
                }
            }
        },
    },

    watch: {
        columnCards: {
            handler() {
                this.$emit("update-cards", this.column);
            },
            deep: true,
        },
    },
});

let app = new Vue({
    el: "#app",
    data: {
        product: "socks",
    },
    methods: {
        moveToNextColumn(column) {
            const index = this.columns.indexOf(column);
            if (index !== -1) {
                this.columns.splice(index, 0, this.columns.pop());
            }
        },
        lockFirstColumn() {
            this.locked = true;
        },
        unlockFirstColumn() {
            this.locked = false;
        },
    },
});