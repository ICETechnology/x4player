/***********************************************************
 * Data
 ***********************************************************/
/**
 * 重新設定日期
 * @memberof XCore_Extend
 * @param {String} yyyymmdd 日期八碼
 * @return {Date} Date 物件
 */
Date.prototype.resetDate = function(yyyymmdd) {
	if (yyyymmdd == null) return;
	yyyymmdd = yyyymmdd.toString().addZero(8);
	var year = yyyymmdd.substr(0, 4);
	var month = parseInt(yyyymmdd.substr(4, 2), 10) - 1;
	var day = yyyymmdd.substr(6, 2);

	this.setFullYear(year);
	// https://stackoverflow.com/questions/14680396/date-setmonth-causes-the-month-to-be-set-too-high-if-date-is-at-the-end-of-t
	this.setMonth(month, 1);
	this.setDate(day);

	return this;
};


/**
 * 重新設定時間
 * @memberof XCore_Extend
 * @param {String} hhmmss 時間六碼
 * @return {Date} Date 物件
 */
Date.prototype.resetTime = function(hhmmss) {
	if (hhmmss == null) return;
	hhmmss = hhmmss.toString().addZero(6);
	var hour = hhmmss.substr(0, 2);
	var minute = hhmmss.substr(2, 2);
	var second = hhmmss.substr(4, 2);

	this.setHours(hour);
	this.setMinutes(minute);
	this.setSeconds(second);

	return this;
};

/**
 * 重新設定時間
 * @memberof XCore_Extend
 * @param {String} hhmmssSSS 時間九碼
 * @return {Date} Date 物件
 */
Date.prototype.resetTimetoMS = function(hhmmssSSS) {
	if (typeof hhmmssSSS === 'number') {
		hhmmssSSS = String(hhmmssSSS);
	}
	if (typeof hhmmssSSS !== 'string') return;
	hhmmssSSS = hhmmssSSS.addZero(9);
	var hour = hhmmssSSS.substr(0, 2);
	var minute = hhmmssSSS.substr(2, 2);
	var second = hhmmssSSS.substr(4, 2);
	var millisecond = hhmmssSSS.substr(6);

	this.setHours(hour);
	this.setMinutes(minute);
	this.setSeconds(second);
	this.setMilliseconds(millisecond);

	return this;
};
// 20200410, 095700000 -> Date
Date.prototype.resetByDT = function(d, t) {
	t = `${t}`.addZero(9).substr(0,6);
	return this.resetDate(d).resetTime(t);
};

/**
 * 將目前時間位移 n 分鐘
 * @memberof XCore_Extend
 * @param {Number} min 分鐘數
 * @return {Date} Date 物件
 */
Date.prototype.addMinutes = function(min) {
	return new Date(this.getTime() + min * 60 * 1000);
};

/**
 * 取得 UTC+0 日期八碼
 * @memberof XCore_Extend
 * @return {String} yyyymmdd
 */
Date.prototype.yyyymmddUTC = function() {
	var yyyy = this.getUTCFullYear().toString();
	var mm = (this.getUTCMonth() + 1).toString(); // 0 = 一月, 11 = 12月
	var dd = this.getUTCDate().toString();
	return yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]); // padding
};

/**
 * 取得 UTC+0 時間六碼
 * @memberof XCore_Extend
 * @return {String} hhmmss
 */
Date.prototype.hhmmssUTC = function() {
	var hh = this.getUTCHours().toString();
	var mm = (this.getUTCMinutes()).toString();
	var ss = this.getUTCSeconds().toString();
	return hh.addZero(2) + mm.addZero(2) + ss.addZero(2); // padding
};

/**
 * 取得日期八碼
 * @memberof XCore_Extend
 * @return {String} yyyymmdd
 */
Date.prototype.yyyymmdd = function() {
	var yyyy = this.getFullYear().toString();
	var mm = (this.getMonth() + 1).toString(); // 0 = 一月, 11 = 12月
	var dd = this.getDate().toString();
	return yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]); // padding
};

/**
 * 取得時間六碼
 * @memberof XCore_Extend
 * @return {String} hhmmss
 */
Date.prototype.hhmmss = function() {
	var hh = this.getHours().toString();
	var mm = (this.getMinutes()).toString();
	var ss = this.getSeconds().toString();
	return hh.addZero(2) + mm.addZero(2) + ss.addZero(2); // padding
};
// '202311090550'
Date.prototype.yyyymmddhhmm = function() {
	let str = this.yyyymmdd() + this.hhmmss();
	return str.substring(0, 12);
};

/**
 * 取得時間六碼
 * @memberof XCore_Extend
 * @param {String} value 切割時間字元
 * @return {String} hhmmss
 */
Date.prototype.formatHHMMSS = function(value) {
	value = value || '';
	var hh = this.getHours().toString();
	var mm = (this.getMinutes()).toString();
	var ss = this.getSeconds().toString();
	if (hh.length === 1) hh = '0' + hh;
	if (mm.length === 1) mm = '0' + mm;
	if (ss.length === 1) ss = '0' + ss;
	return [hh, mm, ss].join(value);
};

/**
 * 加上兩個六碼時間差
 * @memberof XCore_Extend
 * @param {String} end_hhmmss 結束時間六碼
 * @param {String} start_hhmmss 開始時間六碼 (default : 000000)
 * @return {Date} Date 物件
 */
Date.prototype.addhhmmss = function(end_hhmmss, start_hhmmss) {
	end_hhmmss = end_hhmmss.toString().addZero(6);
	start_hhmmss = start_hhmmss.toString().addZero(6);
	var start_hour, start_minute, start_second;
	var end_hour, end_minute, end_second;
	if (start_hhmmss) {
		start_hour = parseInt(start_hhmmss.substr(0, 2), 10);
		start_minute = parseInt(start_hhmmss.substr(2, 2), 10);
		start_second = parseInt(start_hhmmss.substr(4, 2), 10);
	} else {
		start_hour = start_minute = start_second = 0;
	}

	if (end_hhmmss) {
		end_hour = parseInt(end_hhmmss.substr(0, 2), 10);
		end_minute = parseInt(end_hhmmss.substr(2, 2), 10);
		end_second = parseInt(end_hhmmss.substr(4, 2), 10);
	} else {
		end_hour = end_minute = end_second = 0;
	}

	// 跨日判斷
	if (end_hhmmss < start_hhmmss) {
		end_hour += 24;
	}

	var diffTime = (end_hour - start_hour) * 60 + (end_minute - start_minute);

	return new Date(this.getTime() + 1000 * 60 * diffTime);
};

// 取得日期 8 碼 ex. "20190904"
Date.prototype.day8 = function() {
	var yy = this.getFullYear();
	var mm = this.getMonth() + 1;
	var dd = this.getDate();
	if (mm < 10) mm = '0' + mm;
	if (dd < 10) dd = '0' + dd;
	return "" + yy + mm + dd;
}

// 取得日期 6 碼 ex. "201909"
Date.prototype.day6 = function() {
	var yy = this.getFullYear();
	var mm = this.getMonth() + 1;
	if (mm < 10) mm = '0' + mm;
	return "" + yy + mm;
}

// 取得日期 10 碼 (可帶分隔符號) ex. "2019/09/04"
Date.prototype.day10 = function(c) {
	var yy = this.getFullYear();
	var mm = this.getMonth() + 1;
	var dd = this.getDate();
	if (mm < 10) mm = '0' + mm;
	if (dd < 10) dd = '0' + dd;
	return "" + yy + (c?c:"/") + mm + (c?c:"/") + dd;
};

// 取得時間 8 碼 ex. "14:45:00"
Date.prototype.time8 = function() {
	var hh = this.getHours();
	var mm = this.getMinutes();
	var ss = this.getSeconds();
	if (hh < 10) hh = '0' + hh;
	if (mm < 10) mm = '0' + mm;
	if (ss < 10) ss = '0' + ss;
	return hh + ':' + mm + ':' + ss;
};
// 取得時間 11 碼 ex. "14:45:00.000"
Date.prototype.time11 = function() {
	var hh = this.getHours();
	var mm = this.getMinutes();
	var ss = this.getSeconds();
	var ms = this.getMilliseconds();
	if (hh < 10) hh = '0' + hh;
	if (mm < 10) mm = '0' + mm;
	if (ss < 10) ss = '0' + ss;
	if (ms < 10) ms = '00' + ms;
	else if (ms < 100) ms = '0' + ms;
	return hh + ':' + mm + ':' + ss + '.' + ms;
};
Date.prototype.timeHHMM = function() {
	var hh = this.getHours();
	var mm = this.getMinutes();
	if (hh < 10) hh = '0' + hh;
	if (mm < 10) mm = '0' + mm;
	return hh + ':' + mm;
};

// 取得日期時間 18 碼 ex. "2019/09/04 14:45:30"
Date.prototype.dayTime18 = function(c) {
	return this.day10(c) + ' ' + this.time8();
}
// 取得简易時間 11 碼 ex. "09/04 14:45"
Date.prototype.dayTime11 = function(c) {
	var mm = this.getMonth() + 1;
	var dd = this.getDate();
	var hh = this.getHours();
	var mn = this.getMinutes();
	if (mm < 10) mm = '0' + mm;
	if (dd < 10) dd = '0' + dd;
	if (hh < 10) hh = '0' + hh;
	if (mn < 10) mn = '0' + mn;
	return `${mm}/${dd} ${hh}:${mn}`;
}
// 取得简易月日 5 碼 ex. "09/04"
Date.prototype.day5 = function(c) {
	var mm = this.getMonth() + 1;
	var dd = this.getDate();
	if (mm < 10) mm = '0' + mm;
	if (dd < 10) dd = '0' + dd;
	return `${mm}/${dd}`;
}
