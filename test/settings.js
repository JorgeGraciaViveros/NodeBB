'use strict';

const assert = require('assert');
const nconf = require('nconf');

const db = require('./mocks/databasemock');
const settings = require('../src/settings');

describe('settings v3', () => {
	let settings1;
	let settings2;

	it('should create a new settings object', (done) => {
		settings1 = new settings('my-plugin', '1.0', { foo: 1, bar: { derp: 2 } }, done);
	});

	it('should get the saved settings', (done) => {
		assert.equal(settings1.get('foo'), 1);
		assert.equal(settings1.get('bar.derp'), 2);
		done();
	});

	it('should create a new settings instance for same key', (done) => {
		settings2 = new settings('my-plugin', '1.0', { foo: 1, bar: { derp: 2 } }, done);
	});

	it('should pass change between settings object over pubsub', (done) => {
		settings1.set('foo', 3);
		settings1.persist((err) => {
			assert.ifError(err);
			// give pubsub time to complete
			setTimeout(() => {
				assert.equal(settings2.get('foo'), 3);
				done();
			}, 500);
		});
	});

	it('should set a nested value', (done) => {
		settings1.set('bar.derp', 5);
		assert.equal(settings1.get('bar.derp'), 5);
		done();
	});

	it('should reset the settings to default', (done) => {
		settings1.reset((err) => {
			assert.ifError(err);
			assert.equal(settings1.get('foo'), 1);
			assert.equal(settings1.get('bar.derp'), 2);
			done();
		});
	});

	it('should get value from default value', (done) => {
		const newSettings = new settings('some-plugin', '1.0', { default: { value: 1 } });
		assert.equal(newSettings.get('default.value'), 1);
		done();
	});

	it('should return undefined for non-existent key without default', (done) => {
		assert.strictEqual(settings1.get('nonexistent.key'), undefined);
		done();
	});

	it('should return default value for non-existent key with default', (done) => {
		assert.strictEqual(settings1.get('nonexistent.key', 'default_value'), 'default_value');
		done();
	});

	it('should return deeply nested value', (done) => {
		settings1.set('nested.deep.value', 42);
		assert.equal(settings1.get('nested.deep.value'), 42);
		done();
	});

	it('should return nested default value when original value is undefined', (done) => {
		const newSettings = new settings('another-plugin', '1.0', {});
		assert.strictEqual(newSettings.get('nonexistent.deep.key', { deep: { key: 99 } }), 99);
		done();
	});

	it('should return undefined for partially undefined paths without default', (done) => {
		const newSettings = new settings('some-plugin', '1.0', { default: { value: 1 } });
		assert.strictEqual(newSettings.get('default.undefined.path'), undefined);
		done();
	});

	it('should handle complex nested defaults', (done) => {
		const newSettings = new settings('some-plugin', '1.0', {});
		const defaultObject = { complex: { nested: { value: 123 } } };
		assert.strictEqual(newSettings.get('complex.nested.value', defaultObject), 123);
		done();
	});

	it('should return the default value if original object and default are provided', (done) => {
		const newSettings = new settings('some-plugin', '1.0', {});
		assert.strictEqual(newSettings.get('undefined.key', { key: 999 }), 999);
		done();
	});

	it('should correctly retrieve values after reset', (done) => {
		settings1.set('temp.key', 100);
		assert.strictEqual(settings1.get('temp.key'), 100);
		settings1.reset((err) => {
			assert.ifError(err);
			assert.strictEqual(settings1.get('temp.key'), undefined);
			done();
		});
	});

	it('should retrieve a value from the default object when the key is not found in the main config', () => {
		const defaultConfig = { nested: { value: 99 } };
		const result = settings1.get('nested.value', defaultConfig);
		assert.strictEqual(result, 99);
	});
});
