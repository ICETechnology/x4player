/***********************************************************
* String
***********************************************************/
/**
 * 將字串左方補零至指定長度
 * @memberof XCore_Extend
 * @param {number} length 長度
 * @return {string} 補完結果
 */
String.prototype.addZero = function(length) {
	if (this.length >= length) {
		return this.toString();
	} else {
		return new Array(length - this.length + 1).join("0") + this;
	}
};

String.format = function() {
	var s = arguments[0];
	if (s == null)
		return "";
	s = x_variable.fn.langText(s);
	for (var i = 0; i < arguments.length - 1; i++) {
		var reg = getStringFormatPlaceHolderRegEx(i);
		s = s.replace(reg, (arguments[i + 1] == null ? "" : arguments[i + 1]));
	}
	return cleanStringFormatResult(s);
};
String.prototype.format = function() {
	var txt = this.toString();
	for (var i = 0; i < arguments.length; i++) {
		var exp = getStringFormatPlaceHolderRegEx(i);
		txt = txt.replace(exp, (arguments[i] == null ? "" : arguments[i]));
	}
	return cleanStringFormatResult(txt);
};
// 用 split/join 作法，可以支持特殊符號
String.prototype.replaceAll = function(search, replacement) {
	return this.split(search).join(replacement);
};
String.prototype.getDecimalLength = function() {
	var tmp = this.split(".");
	var dlen = tmp[1] ? tmp[1].length : 0;
	// 有科學符號ex: 5e-7時的處理(因使用Big所以這隻js需要引用Big)
	if(tmp[0].indexOf('e') !== -1 && !tmp[1]) {
		dlen = Math.abs(Big(tmp[0]).e);
	}
	return dlen;
};

function getStringFormatPlaceHolderRegEx(placeHolderIndex) {
	return new RegExp('({)?\\{' + placeHolderIndex + '\\}(?!})', 'gm')
}

function cleanStringFormatResult(txt) {
	if (txt == null)
		return "";
	return txt.replace(getStringFormatPlaceHolderRegEx("\\d+"), "");
}
/** 取得隨機字串 8 碼 (可指定長度) */
String.prototype.random = function(len = 8) {
	let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let result = '';
	for (var i = len; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
	return result;
}
/** 取得三位一撇字串 */
String.prototype.commas = function() {
	let x = this.split('.');
	let x1 = x[0];
	let x2 = x.length > 1 ? '.' + x[1] : '';
	let rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

/***********************************************************
* Number
***********************************************************/
Number.prototype.countDecimals = function () {
    if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
    return this.toString().split(".")[1].length || 0; 
}