#!/usr/bin/env node

process.argv.splice(2, 0, 'storefront');
require('./wake');
