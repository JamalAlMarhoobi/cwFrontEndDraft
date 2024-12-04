var webstore = new Vue({
    el: '#app',
    data: {
        showCurriculum: true,
        sitename: 'LEARNIFY',
        order: {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            address: '',
            town: '',
            zip: '',
            emirate: ''
        },
        orderSubmitted: false,
        curriculums: [],
        cart: [],
        emirates: {
            AD: 'Abu Dhabi',
            DXB: 'Dubai',
            SHA: 'Sharjah',
            RAK: 'Ras Al Khaimah'
        },
        sortOption: '',
        searchQuery: ''
    },
    methods: {
        fetchCurriculums() {
            fetch('http://localhost:3000/collection/curriculums')
                .then(response => response.json())
                .then(data => {
                    this.curriculums = data;
                })
                .catch(error => {
                    console.error("Error fetching curriculums:", error);
                });
        },

        validateFirstName() {
            if (!/^[a-zA-Z\s]+$/.test(this.order.firstName)) this.order.firstName = '';
        },
        validateLastName() {
            if (!/^[a-zA-Z\s]+$/.test(this.order.lastName)) this.order.lastName = '';
        },
        validatePhoneNumber() {
            if (!/^\d{0,10}$/.test(this.order.phoneNumber)) this.order.phoneNumber = '';
        },
        validateZip() {
            if (!/^\d{0,10}$/.test(this.order.zip)) this.order.zip = '';
        },

        addToCart(curriculum) {
            if (this.cartCount(curriculum.id) < curriculum.spaces) {
                this.cart.push(curriculum.id);
            } else {
                alert('No more spaces available for this curriculum.');
            }
        },

        showCheckout() {
            if (this.cart.length === 0) {
                alert("Please add a curriculum to your cart before proceeding to checkout.");
                return;
            }
            this.showCurriculum = false;
        },

        goHome() {
            this.showCurriculum = true;
            this.orderSubmitted = false;

            // Reset cart and order details
            this.cart = [];
            this.order = {
                firstName: '',
                lastName: '',
                phoneNumber: '',
                address: '',
                town: '',
                zip: '',
                emirate: ''
            };

            // Reload curriculums
            this.fetchCurriculums();
        },

        increaseQuantity(item) {
            const currentCount = this.cartCount(item.id);
            const availableSpaces = item.spaces - currentCount;
            if (availableSpaces > 0) {
                this.cart.push(item.id);
            } else {
                alert('No more spaces available for this curriculum.');
            }
        },
        decreaseQuantity(item) {
            const index = this.cart.indexOf(item.id);
            if (index !== -1) {
                this.cart.splice(index, 1);
            }
        },
        removeFromCart(item) {
            this.cart = this.cart.filter(id => id !== item.id);
        },

        submitForm() {
            if ((this.orderSubmitted = true) && this.isFormComplete) {
                // Deduce item details
                const orderedItems = this.cartItems.map(item => {
                    const quantity = this.cartCount(item.id);
                    return {
                        id: item.id,
                        subject: item.subject,
                        location: item.location,
                        price: item.price,
                        quantity,
                        total: item.price * quantity // Individual total
                    }
                });
                // Calculate the grand total
                const grandTotal = orderedItems.reduce((sum, item) => sum + item.total, 0);

                const newOrder = {
                    firstName: this.order.firstName,
                    lastName: this.order.lastName,
                    phoneNumber: this.order.phoneNumber,
                    address: this.order.address,
                    town: this.order.town,
                    emirate: this.order.emirate,
                    zip: this.order.zip,
                    orderedItems: orderedItems,
                    grandTotal: grandTotal
                };

                fetch('http://localhost:3000/collection/orders', {
                    method: 'POST', // HTTP method
                    headers: {
                        'Content-Type': 'application/json', // Set content type
                    },
                    body: JSON.stringify(newOrder), // Stringify the order object
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to submit the order');
                        }
                        return response.json();
                    })
                    .then(responseJSON => {
                        console.log('Order submitted successfully:', responseJSON);
                        this.orderSubmitted = true; // Show success message

                        // Refresh curriculums to reflect updated spaces
                        this.fetchCurriculums();
                    })
                    .catch(error => {
                        console.error('Error submitting order:', error);
                    });
            }
            alert('Order successfully placed!');
        },

        canAddToCart(curriculum) {
            return curriculum.spaces > this.cartCount(curriculum.id);
        },
        cartCount(id) {
            return this.cart.filter(itemId => itemId === id).length;
        },

        sortCurriculums() {
            // Triggering reactivity by updating the curriculums list.
            this.curriculums = [...this.curriculums];
        }
    },
    computed: {
        cartItemCount() {
            return this.cart.length || "";
        },
        cartItems() {
            return this.curriculums.filter(item => this.cart.includes(item.id));
        },
        totalCartPrice() {
            return this.cartItems.reduce((total, item) => total + (item.price * this.cartCount(item.id)), 0);
        },

        isFormComplete() {
            return (
                this.order.firstName &&
                this.order.lastName &&
                this.order.phoneNumber &&
                this.order.address &&
                this.order.town &&
                this.order.emirate &&
                this.order.zip &&
                this.cart.length > 0
            );
        },

        filteredCurriculums() {
            const query = this.searchQuery.toLowerCase();
            return this.curriculums.filter(
                curriculum =>
                    curriculum.subject.toLowerCase().includes(query) ||
                    curriculum.location.toLowerCase().includes(query)
            );
        },
        sortedCurriculums() {
            let filtered = this.filteredCurriculums;

            if (this.sortOption === "subjectAsc") {
                filtered.sort((a, b) => a.subject.localeCompare(b.subject));
            } else if (this.sortOption === "subjectDesc") {
                filtered.sort((a, b) => b.subject.localeCompare(a.subject));
            } else if (this.sortOption === "locationAsc") {
                filtered.sort((a, b) => a.location.localeCompare(b.location));
            } else if (this.sortOption === "locationDesc") {
                filtered.sort((a, b) => b.location.localeCompare(a.location));
            } else if (this.sortOption === "priceAsc") {
                filtered.sort((a, b) => a.price - b.price);
            } else if (this.sortOption === "priceDesc") {
                filtered.sort((a, b) => b.price - a.price);
            } else if (this.sortOption === "ratingAsc") {
                filtered.sort((a, b) => a.rating - b.rating);
            } else if (this.sortOption === "ratingDesc") {
                filtered.sort((a, b) => b.rating - a.rating);
            }
            return filtered;
        }
    },
    mounted() {
        this.fetchCurriculums(); // Fetch data on load
    }
});