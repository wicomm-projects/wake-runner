#!/usr/bin/env node

process.argv.splice(2, 0, 'tailwind');
require('./wake');
