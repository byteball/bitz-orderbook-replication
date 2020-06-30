/*jslint node: true */
"use strict";
const path = require('path');
require('dotenv').config({ path: path.dirname(process.mainModule.paths[0]) + '/.env' });


// websocket URL of Bit-Z node we are are connecting to
exports.bitz_ws_url = 'wss://wsapi.bitz.so';

// source exchange authentication
exports.sourceApiKey = process.env.sourceApiKey;
exports.sourceApiSecret = process.env.sourceApiSecret;

// destination exchange authentication
exports.destApiKey = process.env.destApiKey;
exports.destApiSecret = process.env.destApiSecret;
exports.destPassword = process.env.destPassword;

exports.MARKUP = (typeof process.env.MARKUP !== 'undefined') ? parseFloat(process.env.MARKUP) : 2; // %

exports.quote_currency = 'BTC';
exports.dest_pair = 'GBYTE/' + exports.quote_currency;
exports.dest_ws_pair = 'gbyte_btc';

exports.MIN_QUOTE_BALANCE = process.env.MIN_QUOTE_BALANCE || 0.001;
exports.MIN_BASE_BALANCE = process.env.MIN_BASE_BALANCE || 0.01;

exports.MIN_DEST_ORDER_SIZE = 0.01; // in base currency
exports.MIN_SOURCE_ORDER_SIZE = 0.2; // in base currency
