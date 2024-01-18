Vue.component('column', {
    template: `
     <div class="column" id="column1">
            <h2>column 1</h2>
            <div class="card">
                <h3>card 1</h3>
                <ul class="list">
                    <li class="list-item">
                        <input type="checkbox" class="checkbox">check 1</li>
                    <li class="list-item">
                        <input type="checkbox" class="checkbox">check 2</li>
                    <li class="list-item">
                        <input type="checkbox" class="checkbox">check 3</li>
                </ul>
            </div>
        </div>
    `,
    data() {
        return {
            name: null
        }
    }
})

let app = new Vue({
    el: '#app',
    data: {
        product: "socks"
        }
})