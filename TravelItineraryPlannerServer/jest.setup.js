process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Commenting log shows process || uncommenting keeps it cleaner
if (global.console) {
    global.console = {
        ...console,
        // log: jest.fn(),  // Uncomment this or not depending on your preference
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
    };
}
