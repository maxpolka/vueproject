Vue.component('mainboard', {
    props: ['card', 'columnIndex', 'cardIndex'],
    template: `
        <div class="card"
             :class="{ 'completed-on-time': card.status === 'Completed on time', 'overdue': card.status === 'Overdue' }">
            <div class="card-title">{{ card.title }}</div>
            <div class="card-date">Created: {{ card.dateCreated }}</div>
            <div class="card-date">Last change: {{ card.lastEdited }}</div>
            <div class="card-description">{{ card.description }}</div>
            <div class="card-deadline" v-if="card.deadline">Deadline: {{ card.deadline }}</div>
            <div class="card-status" v-if='columnIndex === 3'>
                {{ columnIndex === 3 && currentDate > deadlinefilter ? 'deadline filed' : 'deadline complete' }}
            </div>

            <div v-if="card.comment">reason: {{ card.comment }}</div>

            <div class="card-actions">
                <button v-if="columnIndex !== 3" @click="editCard">change</button>
                <button @click="deleteCard" v-if="columnIndex === 0">Remove</button>
                <button v-if="columnIndex === 0" @click="moveToInProgress">In work</button>
                <button v-if="columnIndex === 1" @click="moveToTesting">In testing</button>
                <button v-if="columnIndex === 2" @click="moveToDone">In completing task</button>
                <button v-if="columnIndex === 2" @click="onClick">Create reason</button>
            </div>

            <div v-if="showEditForm" class="edit-form">
                <label>Tittle: </label><input v-model="editedTitle" />
                <label>description: </label><textarea v-model="editedDescription"></textarea>
                <label>Deadline: </label><input type="date" v-model="editedDeadline" />
                <button @click="saveEdits">Save</button>
                <button @click="cancelEdits">Cancel</button>
            </div>

            <div v-show="this.click">
            <form @submit.prevent="returnToInProgress"> 
                <label>Commint: </label><input required v-model="card.comment" placeholder="Enter the commint" />
                <input type="submit" value="Enter"/> 
            </form>
            </div>

        </div>
    `,
    data() {
        return {
            showEditForm: false,
            editedTitle: this.card.title,
            editedDescription: this.card.description, 
            editedDeadline: this.card.deadline,
            click: false, 
            deadlinefilter: new Date(this.card.deadline)
        };
    }, computed: {
        currentDate() {
            return new Date();
        },
        deadline() {
            return new Date(originalCard.deadline);
        }
    },
    methods: {
        editCard() {
            this.showEditForm = true; //Показывает форму редактирования карточки
        },
        saveEdits() { //Сохраняет внесенные изменения в карточке
            this.card.title = this.editedTitle;
            this.card.description = this.editedDescription;
            this.card.deadline = this.editedDeadline;
            this.card.lastEdited = new Date().toLocaleString();
            this.showEditForm = false;
        },
        onClick() {
            this.click = true; //функция клика к комменту
        },
        cancelEdits() {
            this.showEditForm = false; //отменить изменения редактирования
        },
        deleteCard() {
            this.$emit('delete-card', this.columnIndex, this.cardIndex);
        },
        moveToInProgress() {
            this.$emit('move-to-in-progress', this.card, this.columnIndex, this.cardIndex);
        },
        moveToTesting() {
            this.$emit('move-to-testing', this.card, this.columnIndex, this.cardIndex);
        },
        moveToDone() {
            this.$emit('move-to-done', this.card, this.columnIndex, this.cardIndex);
            // moveToCompletedWithColumn()
        },
        returnToInProgress() { //большая функция с процессом
            try {
                const inProgressIndex = 1; //индекс колонки
                const isCardAlreadyInInProgress = this.$parent.columns[inProgressIndex].cards.some(card => card.title === this.card.title);
                //Проверяет, существует ли уже карточка с таким же заголовком в колонке задачи в работе
                if (!isCardAlreadyInInProgress) {
                    this.$parent.columns[inProgressIndex].cards.push({
                        title: this.card.title,
                        description: this.card.description,
                        deadline: this.card.deadline,
                        dateCreated: this.card.dateCreated,
                        lastEdited: new Date().toLocaleString(),
                        comment: this.card.comment
                    });
                }

                this.$parent.columns[this.columnIndex].cards.splice(this.cardIndex, 1);
                this.card.comment = '';
                this.click = false;
            } catch (error) {
                console.error('Ошибка в функции returnToInProgress:', error);
            }
        },
        moveToCompletedWithColumn() { //проверка deadline 
            const completedIndex = 3; //индекс колонки
            const deadline = new Date(this.card.deadline);
            const currentDate = new Date();

            this.$parent.columns[completedIndex].cards.push({
                title: this.card.title,
                description: this.card.description,
                deadline: this.card.deadline,
                dateCreated: this.card.dateCreated,
                lastEdited: new Date().toLocaleString(),
                status: this.card.status,
                comment: this.card.comment
            });

            this.$parent.columns[this.columnIndex].cards.splice(this.cardIndex, 1);
        }
    }
});


new Vue({
    el: '#app',
    data: {
        columns: [
            { name: 'Scheduled tasks', cards: [] },
            { name: 'Scheduled in work', cards: [] },
            { name: 'Testing', cards: [] },
            { name: 'Completing task', cards: [] }
        ],
        newCard: { title: '', description: '', deadline: '', comment: '' }
    },
    computed: {
        formIsNormal() {
            return this.newCard.title && this.newCard.description && this.newCard.deadline; 
        },
        canDelete() {
            return this.columnIndex === 0; //удаление для первой колонки
        },
    },
    methods: {
        addCard(columnIndex) {
            if (columnIndex === 0 && this.formIsNormal) { //создает новую карту
                const newCard = {
                    title: this.newCard.title,
                    description: this.newCard.description,
                    deadline: this.newCard.deadline,
                    dateCreated: new Date().toLocaleString(),
                    lastEdited: new Date().toLocaleString(),
                    comment: this.newCard.comment

                };
                this.columns[columnIndex].cards.push(newCard);
                this.clearNewCard();
                deadlinefilter = this.newCard.deadline
            }
        },
        clearNewCard() {
            this.newCard = { title: '', description: '', deadline: '', comment: '' }; //очищает данные формы для повторного заполнения
        },
        deleteCard(columnIndex, cardIndex) { //Удаление карты в 1 колонке
            if (columnIndex >= 0 && columnIndex < this.columns.length) {
                if (cardIndex >= 0 && cardIndex < this.columns[columnIndex].cards.length) {

                    this.columns[columnIndex].cards.splice(cardIndex, 1);
                }
            }
        },
        moveToInProgress(originalCard, columnIndex, cardIndex) { //перенос карты в колонку в процессе
            const inProgressIndex = 1;

            this.columns[inProgressIndex].cards.push({
                title: originalCard.title,
                description: originalCard.description,
                deadline: originalCard.deadline,
                dateCreated: originalCard.dateCreated,
                lastEdited: originalCard.lastEdited,
                comment: originalCard.comment
            });

            this.columns[columnIndex].cards.splice(cardIndex, 1);
        },
        moveToTesting(originalCard, columnIndex, cardIndex) { //перенос карты в колонку в тестирование
            const testingIndex = 2;

            this.columns[testingIndex].cards.push({
                title: originalCard.title,
                description: originalCard.description,
                deadline: originalCard.deadline,
                dateCreated: originalCard.dateCreated,
                lastEdited: originalCard.lastEdited,
                comment: originalCard.comment
            });

            this.columns[columnIndex].cards.splice(cardIndex, 1);
        },
        moveToDone(originalCard, columnIndex, cardIndex) { //перенос карты в колонку выполненные задачи
            const doneIndex = 3;

            this.columns[doneIndex].cards.push({
                title: originalCard.title,
                description: originalCard.description,
                deadline: originalCard.deadline,
                dateCreated: originalCard.dateCreated,
                lastEdited: originalCard.lastEdited,
                comment: originalCard.comment
            });
            const deadline = new Date(originalCard.deadline);
        },
        moveToCompletedWithColumn(originalCard, columnIndex, cardIndex) { //Перенос столбца из 3 в 4
            const completedIndex = 3;

            const deadline = new Date(originalCard.deadline);
            const currentDate = new Date();

            this.columns[completedIndex].cards.push({
                title: originalCard.title,
                description: originalCard.description,
                deadline: originalCard.deadline,
                dateCreated: originalCard.dateCreated,
                lastEdited: originalCard.lastEdited,
                status: originalCard.status,
                comment: originalCard.comment
            });

            this.columns[columnIndex].cards.splice(cardIndex, 1);
        }
    }
});


