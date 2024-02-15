export default {
	data: function () {
		return {
			// 訂閱事件表 (on/off/trigger)
			evtToCallbackMap: {},
		}
	},
	methods: {
		// 訂閱事件
		on(evt, cb) {
			let self = this;
			let key = "".random(16);
			let map = self.evtToCallbackMap[evt];
			if (map == null) {
				map = self.evtToCallbackMap[evt] = {};
			}
			map[key] = cb;
			return key;
		},
		// 解除訂閱事件
		off(evt, key) {
			let self = this;
			let map = self.evtToCallbackMap[evt];
			delete map[key];
		},
		// 觸發事件
		trigger(evt) {
			let self = this;
			let map = self.evtToCallbackMap[evt];
			if (map) {
				for (let key in map) {
					let callback = map[key];
					callback.apply(self, [].slice.call(arguments).slice(1));
				}
			}
		},
	},
}