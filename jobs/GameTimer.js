const {parentPort, Worker, isMainThread, workerData } = require('worker_threads');

parentPort.postMessage("lol")
