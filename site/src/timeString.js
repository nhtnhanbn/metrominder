function timeString(seconds, displaySeconds = false) {
    const date = new Date(1000*seconds);
    
    return date.getHours().toString().padStart(2, "0") +
           ":" + date.getMinutes().toString().padStart(2, "0") +
           (displaySeconds ?
               ":" + date.getSeconds().toString().padStart(2, "0") :
               ""
           );
}

export { timeString };
