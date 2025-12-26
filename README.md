# K.A.N EGG MART - Egg Shop Website

A simple, modern website for managing an egg shop with menu management, cart functionality, billing, QR code payments, and sales reporting.

## Features

- **Menu Display**: Browse available items with images
- **Shopping Cart**: Add items to cart, adjust quantities, and manage items
- **Billing**: Automatic bill calculation with print functionality
- **QR Code Payment**: Generate UPI QR codes for payments
- **Menu Management**: Full CRUD operations for menu items (Add, Edit, Delete)
- **Sales Reports**: Monthly sales reports with statistics and CSV export
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Setup Instructions

1. **Open the Website**
   - Simply open `index.html` in a web browser
   - No server setup required - works with file:// protocol

2. **Initial Setup**
   - Go to "Manage Menu" page
   - Configure your UPI ID in the Payment Settings section
   - Add product images to the `images/` folder or use image URLs

3. **Adding Product Images**
   - Place product images in the `images/` folder
   - Recommended image names:
     - `white-eggs.jpg`
     - `country-eggs.jpg`
     - `quail-eggs.jpg`
     - `milk.jpg`
     - `oil.jpg`
     - `bread.jpg`
     - `biscuit.jpg`
   - Or use image URLs when adding items through the admin panel

## Default Menu Items

The application comes pre-loaded with:
- White Eggs (₹50)
- Country Eggs (₹60)
- Quail Eggs (₹80)
- Milk (₹30)
- Refined Oil (₹120)
- Bread (₹25)
- Biscuit (₹20)

## How to Use

### For Customers:
1. Browse items on the Menu page
2. Click on any item to add it to cart
3. Go to Cart page to review items
4. Adjust quantities or remove items
5. Click "Pay Now" to see QR code
6. Scan QR code with UPI app to pay
7. Click "Payment Done" after payment
8. Use "Print Bill" to print receipt

### For Admin:
1. **Manage Menu**: Add, edit, or delete menu items
2. **Set UPI ID**: Configure your UPI ID for payments
3. **View Sales**: Check monthly sales reports
4. **Export Data**: Export sales data to CSV

## File Structure

```
K.A.N EGG MART/
├── index.html              # Home page with menu
├── cart.html               # Cart and billing page
├── admin.html              # Menu management
├── sales-report.html       # Sales reports
├── css/
│   └── style.css           # Main stylesheet
├── js/
│   ├── utils.js            # Utility functions
│   ├── menu.js             # Menu display logic
│   ├── cart.js             # Cart management
│   ├── admin.js            # Admin CRUD operations
│   └── sales.js            # Sales report logic
└── images/                 # Product images folder
```

## Data Storage

All data is stored in browser's localStorage:
- Menu items
- Cart contents
- Sales records
- UPI ID configuration

**Note**: Data is stored locally in the browser. Clearing browser data will remove all stored information.

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Technologies Used

- HTML5
- CSS3 (with Flexbox and Grid)
- Vanilla JavaScript (ES6+)
- QRCode.js library (via CDN)
- localStorage API

## Notes

- Product images are optional - the app will show a placeholder if image is missing
- UPI QR codes are generated dynamically based on the configured UPI ID
- Sales reports filter by month and year
- Bills can be printed directly from the browser
- All prices are in Indian Rupees (₹)

## Support

For issues or questions, check the browser console for error messages.

