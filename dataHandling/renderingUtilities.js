const getWeekday = (dayNumber) => {
  const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
  return weekdays[dayNumber - 1];
};

module.exports = getWeekday;
