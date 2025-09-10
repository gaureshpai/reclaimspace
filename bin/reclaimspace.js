#!/usr/bin/env node

import path from 'path';

const baseDir = process.cwd();

import { run } from '../src/main.js';
run(baseDir);