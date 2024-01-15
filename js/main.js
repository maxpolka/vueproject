let app = new Vue({
    el: '#app',
    data: {
        product: "Socks",
        image: "./img/vmSocks-green-onWhite.jpg",
        altText: "A pair of socks",
        inStock: true,
        details: ['80% cotton', '20% polyester', 'Gender-neutral'],
        variants: [
            {
                variantId: 2234,
                variantColor: 'green',
                variantImage: "./img/vmSocks-green-onWhite.jpg",
            },
            {
                variantId: 2235,
                variantColor: 'blue',
                variantImage: "./img/vmSocks-blue-onWhite.jpg",
            }
        ],
        cart: 0
    },
    methods: {
        addToCart() {
            this.cart += 1
        },
        updateProduct(variantImage) {
            this.image = variantImage
        },
        RemoveFromCart() {
            if (this.cart >= 1) { 
                this.cart -= 1
            }
        }

    }
})
