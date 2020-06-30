const EventEmitter = require('events')//.EventEmitter;
const zlib = require('zlib');
const { promisify } = require('util');
const WebSocket = require('ws');

class WsEmitter extends EventEmitter {

	constructor(url) {
		super();
		this.url = url;
		this.ws = null;
		setInterval(() => {
			this.send('ping');
		}, 5000);
	}

	connect(onDone) {
		let self = this;
		if (!onDone)
			return new Promise(resolve => this.connect(resolve));

		if (self.ws) {
			if (self.ws.readyState === self.ws.OPEN) {
				console.log("already connected");
				return onDone();
			}
			if (!self.ws.done) {
				console.log("already connecting");
				self.ws.once('done', onDone);
				return;
			}
			console.log("closing, will reopen");
		}

		self.ws = new WebSocket(this.url);
		self.ws.setMaxListeners(20); // avoid warning

		self.ws.done = false;
		function finishConnection(_ws, err) {
			if (_ws && !_ws.done) {
				_ws.done = true;
				onDone(err);
				if (_ws)
					_ws.emit('done', err);
			}
		}

		let abandoned = false;
		let timeout = setTimeout(function () {
			abandoned = true;
			finishConnection(self.ws, 'timeout');
			self.ws = null;
		}, 5000);

		self.ws.once('open', function onWsOpen() {
			if (abandoned) {
				console.log("abandoned connection opened, will close");
				this.close();
				return;
			}
			clearTimeout(timeout);
			self.ws.last_ts = Date.now();
			console.log('connected');
			finishConnection(this);
			self.send('ping');
			self.emit('connected');
		});

		self.ws.on('close', function onWsClose() {
			console.log('ws closed');
			clearTimeout(timeout);
			self.ws = null;
			setTimeout(self.connect.bind(self), 1000);
			finishConnection(this, 'closed');
			self.emit('disconnected');
		});

		self.ws.on('error', function onWsError(e) {
			console.log("error from WS server: " + e);
			clearTimeout(timeout);
			var err = e.toString();
			self.ws = null;
			setTimeout(self.connect.bind(self), 1000);
			finishConnection(this, err);
		});

		self.ws.on('message', function (message) { // 'this' is set to ws
			self.onWebsocketMessage(this, message);
		});
	}


	async onWebsocketMessage(_ws, message) {
		if (_ws.readyState !== _ws.OPEN)
			return console.log("received a message on Bit-Z socket with ready state " + _ws.readyState);
		
		if (message === 'pong')
			return console.log('received pong');
		
	//	console.log('received from Bit-Z '+ message);
		message = await promisify(zlib.unzip)(message);
	//	console.log('unzipped ' + message);
		_ws.last_ts = Date.now();
		
		try {
			var objMessage = JSON.parse(message);
			var channel = objMessage.action;
			var payload = objMessage.data;
		}
		catch(e){
			return console.log('failed to json.parse message '+message.toString().substr(0, 40)+': '+e);
		}
	//	if (typeof payload !== 'object')
	//		return console.log('payload is not an object: ' + payload);
		
		console.log('received from Bit-Z parsed:', JSON.stringify(objMessage, null, '\t'));
		this.emit(channel, payload);
	}

	isConnected() {
		return (this.ws && this.ws.readyState === this.ws.OPEN);
	}

	async send(message) {
		let ws = this.ws;
		if (!ws || ws.readyState !== ws.OPEN) {
			let err = await this.connect();
			if (err)
				return err;
			ws = this.ws;
		}

		if (!ws)
			throw Error("no ws after connect");
		
		return new Promise(resolve => {
			if (typeof message === 'object')
				message = JSON.stringify(message);
			ws.send(message, function(err){
				if (err)
					ws.emit('error', 'From send: ' + err);
				resolve(err);
			});
		});
	}

	// pairName = gbyte_btc
	async subscribeOrdersAndTrades(pairName) {
		await this.send(JSON.stringify({
			"action": "Topic.sub",
			"data": {
				"symbol": pairName,
			//	"type": "depth,order",
				"type": "order",
				"resolution": "60min",
				"_CDID": "100002",
				"dataType": "1"
			},
			"msg_id": Date.now()
		}));
	}




}

module.exports = WsEmitter;
