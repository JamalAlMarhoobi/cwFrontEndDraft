var webstore = new Vue({
    // Bind Vue instance to the HTML element with id="app"
    el: '#app',
    data: {
        // State variables for controlling the app's behavior
        showCurriculum: true, // Determines if the curriculum or checkout page is displayed
        sitename: 'LEARNIFY', // App name displayed in the header

        // Order details
        order: {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            address: '',
            town: '',
            zip: '',
            emirate: ''
        },

        orderSubmitted: false, // Tracks if the order has been submitted
        curriculums: [], // Holds the list of curriculums fetched from the server
        cart: [], // Tracks the IDs of items added to the cart

        // Emirate dropdown options
        emirates: {
            AD: 'Abu Dhabi',
            DXB: 'Dubai',
            SHA: 'Sharjah',
            RAK: 'Ras Al Khaimah'
        },

        // Sorting and searching
        sortField: '', // Field to sort by (e.g., subject, price)
        sortDirection: '', // Sorting order (asc or desc)
        searchQuery: '' // Query string for filtering curriculums
    },
    methods: {
        // Fetch the list of curriculums from the server
        fetchCurriculums() {
            fetch('https://cwbackenddraft.onrender.com/collection/curriculums')
                .then(response => response.json())
                .then(data => {
                    this.curriculums = data; // Update the curriculums array
                })
                .catch(error => {
                    console.error("Error fetching curriculums:", error); // Log errors
                });
        },

        // Toggle between curriculum and checkout views
        toggleCheckout() {
            this.showCurriculum = !this.showCurriculum;
        },

        // Sort curriculums based on the selected field and direction
        sortCurriculums() {
            // Trigger sorting by reassigning the curriculums array
            this.curriculums = [...this.curriculums];
        },

        // Validation methods for form fields
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

        // Add a curriculum to the cart
        addToCart(curriculum) {
            if (this.cartCount(curriculum.id) < curriculum.spaces) {
                this.cart.push(curriculum.id);
            } else {
                alert('No more spaces available for this curriculum.');
            }
        },

        // Remove a curriculum from the cart
        removeFromCart(item) {
            this.cart = this.cart.filter(id => id !== item.id);
        },

        // Adjust the quantity of a curriculum in the cart
        increaseQuantity(item) {
            const currentCount = this.cartCount(item.id);
            if (item.spaces - currentCount > 0) {
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

        // Submit the order
        submitForm() {
            if ((this.orderSubmitted = true) && this.isFormComplete) {
                // Prepare order details
                const orderedItems = this.cartItems.map(item => ({
                    id: item.id,
                    subject: item.subject,
                    location: item.location,
                    price: item.price,
                    quantity: this.cartCount(item.id),
                    total: item.price * this.cartCount(item.id)
                }));

                // Calculate the total price of the order
                const grandTotal = orderedItems.reduce((sum, item) => sum + item.total, 0);

                const newOrder = {
                    ...this.order,
                    orderedItems,
                    grandTotal
                };

                // Send order to the server
                fetch('https://cwbackenddraft.onrender.com/collection/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newOrder)
                })
                    .then(response => {
                        if (!response.ok) throw new Error('Failed to submit the order');
                        return response.json();
                    })
                    .then(responseJSON => {
                        console.log('Order submitted successfully:', responseJSON);
                        this.orderSubmitted = true;
                        this.fetchCurriculums(); // Refresh curriculums to update spaces
                    })
                    .catch(error => {
                        console.error('Error submitting order:', error);
                    });

                alert('Order successfully placed!');
            }
        },

        // Reset to the home view and clear data
        goHome() {
            this.showCurriculum = true;
            this.orderSubmitted = false;
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
            this.fetchCurriculums();
        },

        // Helper functions
        canAddToCart(curriculum) {
            return curriculum.spaces > this.cartCount(curriculum.id);
        },
        cartCount(id) {
            return this.cart.filter(itemId => itemId === id).length;
        },
        imageLink(image) {
            return `https://cwbackenddraft.onrender.com/images/${image}`;
        }
    },
    computed: {
        // Count of items in the cart
        cartItemCount() {
            return this.cart.length || '';
        },

        // List of items in the cart with details
        cartItems() {
            return this.curriculums.filter(item => this.cart.includes(item.id));
        },

        // Total price of items in the cart
        totalCartPrice() {
            return this.cartItems.reduce((total, item) => total + item.price * this.cartCount(item.id), 0);
        },

        // Check if the order form is complete
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

        // Filter curriculums based on the search query
        filteredCurriculums() {
            return this.curriculums.filter(curriculum =>
                curriculum.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                curriculum.location.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        },

        // Sort and filter curriculums based on search, sort field, and sort direction
        sortedCurriculums() {
            let filtered = this.filteredCurriculums;

            if (this.sortField) {
                filtered.sort((a, b) => {
                    let valueA = a[this.sortField];
                    let valueB = b[this.sortField];

                    if (typeof valueA === 'string') valueA = valueA.toLowerCase();
                    if (typeof valueB === 'string') valueB = valueB.toLowerCase();

                    const comparison = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
                    return this.sortDirection === 'desc' ? -comparison : comparison;
                });
            }

            return filtered;
        }
    },
    mounted() {
        this.fetchCurriculums(); // Load curriculums when the app is initialized
    }
});