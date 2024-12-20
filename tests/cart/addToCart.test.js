const { addToCart } = require('../../controller/cyber.controller.cart');
const cartModel = require('../../model/cyber.model.cart');

// Mock cartModel methods
jest.mock('../../model/cyber.model.cart');

describe('addToCart', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      id: 'user123', // Example user ID
      body: {
        productId: 'product123', // Example product ID
        quantity: 2, // Example quantity
        product_price: 100, // Example price
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('should return 400 if productId is not provided', async () => {
    req.body.productId = undefined; // Simulate missing productId

    await addToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid input data.',
    });
  });

  it('should add a new product to the cart when cart does not exist', async () => {
    cartModel.findOne.mockResolvedValueOnce(null); // Simulate that no cart exists

    const mockSave = jest.fn().mockResolvedValueOnce({}); // Mock save method

    cartModel.prototype.save = mockSave;

    await addToCart(req, res);

    expect(cartModel.findOne).toHaveBeenCalledWith({ userId: 'user123' });
    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, cart: expect.any(Array) });
  });

  it('should update the quantity if the product already exists in the cart', async () => {
    // Simulate an existing cart with the same product
    const existingCart = {
      products: [{ productId: 'product123', quantity: 1, product_price: 100 }],
      save: jest.fn().mockResolvedValueOnce({}),
      populate: jest.fn().mockResolvedValueOnce({}),
    };

    cartModel.findOne.mockResolvedValueOnce(existingCart);

    await addToCart(req, res);

    // Check if the cart is updated with the correct quantity
    expect(existingCart.products[0].quantity).toBe(3); // 1 + 2
    expect(existingCart.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, cart: expect.any(Array) });
  });

  it('should return 500 if there is a database error', async () => {
    const errorMessage = 'Database error';
    cartModel.findOne.mockRejectedValueOnce(new Error(errorMessage)); // Simulate database error

    await addToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error adding to cart',
      error: errorMessage,
    });
  });
});
