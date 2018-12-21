module.exports = {
    addDays: function (days) {
        var newDate = new Date();
        newDate.setTime( newDate.getTime() + days * 86400000 );
        return newDate;
    },

    substractDays: function (days) {
        var newDate = new Date();
        newDate.setTime( newDate.getTime() - days * 86400000 );
        return newDate;
    }
};