const { clearCart } = require('../../controller/cyber.controller.cart');
const cartModel = require('../../model/cyber.model.cart');

jest.mock('../../model/cyber.model.cart');

describe('clearCart', () => {
  let req, res;

  beforeEach(() => {
    req = {
      id: 'mockUserId',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return 404 if the cart is already empty', async () => {
    cartModel.findOne.mockResolvedValueOnce({
      products: [],
      save: jest.fn(),
    });

    await clearCart(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Cart is already empty 🗑',
    });
  });

  it('should clear the cart and return success message', async () => {
    const mockCart = {
      products: [{ productId: '123', quantity: 1 }],
      totalPrice: 100,
      save: jest.fn(),
    };

    cartModel.findOne.mockResolvedValueOnce(mockCart);

    await clearCart(req, res);

    expect(mockCart.products).toEqual([]);
    expect(mockCart.totalPrice).toBe(0);
    expect(mockCart.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Cart cleared successfully 🗑',
      cart: mockCart,
    });
  });

  it('should return 500 if an error occurs', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
    cartModel.findOne.mockRejectedValueOnce(new Error('Database error'));
  
    await clearCart(req, res);
  
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
      error: 'Database error',
    });
  
    consoleErrorSpy.mockRestore(); // Restore the original implementation
  });

});
