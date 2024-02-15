export default {
	props: ['suspend'],
	// 使用這個行情代理元件需組件本身擁用sid 及suspend 變數才能正常使用
	data: function () {
		return {
			qo: {},
			// 是否可視 (預設 true)
			visibility: true,
		}
	},
	beforeMount() {
		if(this.isSymbol) {
			// 訂閱商品
			if (!this.suspend && this.visibility)
				M4C.Quote.sub(this.monthSid, this);
			// 指派響應式變數
			if(!this.throwttleQo)
				this.qo = M4C.Quote.getQuoteObject(this.monthSid);
			// 延遲更新qo
			else{
				this.qo = Object.assign({}, M4C.Quote.getQuoteObject(this.monthSid));
				this.orgQo = M4C.Quote.getQuoteObject(this.monthSid);
				let self = this;
				this.throwttleIntaerval = setInterval(() => {
					self.qo = Object.assign({}, self.orgQo);
				}, 500);
			}
		}
	},
	computed: {
		monthSid() {return M4C.Symbol.toMonthSymbol(this.sid)},
		// 依照商品可取得價格依續回傳
		$qoPrice() {return this.qo.p || this.qo.r || this.qo.pc;},
		isSymbol() {
			try {return this.sid.indexOf('I.') == 0;} catch(e) {}
		},
	},
	watch: {
		// 暫停、回復行情資料。
		suspend(nv, ov) {
			if(this.isSymbol) {
				// 不可視狀態不動作
				if (!this.visibility) return;
				// 訂閱/解訂閱商品
				M4C.Quote[nv?'unsub':'sub'](this.monthSid, this);
				// 回復響應式行情資料
				if(!nv){
					if(!this.throwttleQo)
						this.qo = M4C.Quote.getQuoteObject(this.monthSid);
					else
						this.orgQo = M4C.Quote.getQuoteObject(this.monthSid);
				}
				// 暫停更新行情資料。
				else {
					this.qo = Object.assign({}, M4C.Quote.getQuoteObject(this.monthSid));
					this.orgQo = Object.assign({}, M4C.Quote.getQuoteObject(this.monthSid));
				}
			}
		},
		// 可視切換 (QuoteCard 在不可視的時候要解訂閱)
		visibility(nv) {
			if(this.isSymbol) {
				// 停用狀態不動作
				if (this.suspend) return;
				// 訂閱/解訂閱商品
				M4C.Quote[nv?'sub':'unsub'](this.monthSid, this);
			}
		},
		// 切換商品時解訂舊商品，訂閱新商品。
		sid(nv, ov){
			if(this.isSymbol) {
				M4C.Quote.unsub( M4C.Symbol.toMonthSymbol(ov), this);
				M4C.Quote.sub( M4C.Symbol.toMonthSymbol(nv), this);
				this.qo = M4C.Quote.getQuoteObject(M4C.Symbol.toMonthSymbol(nv));
			}
		},

		selfSuspend(nv, ov){
			if(this.isSymbol) {
				M4C.Quote[nv?'unsub':'sub'](this.monthSid, this);
				// 回復響應式行情資料
				if(!nv){
					if(!this.throwttleQo)
						this.qo = M4C.Quote.getQuoteObject(this.monthSid);
					else
						this.orgQo = M4C.Quote.getQuoteObject(this.monthSid);
				}
				// 暫停更新行情資料。
				else {
					this.qo = Object.assign({}, M4C.Quote.getQuoteObject(this.monthSid));
					this.orgQo = Object.assign({}, M4C.Quote.getQuoteObject(this.monthSid));
				}
			}
		}
	},
	beforeDestroy() {
		// 解訂商品
		M4C.Quote.unsub(this.monthSid, this);
	},
}