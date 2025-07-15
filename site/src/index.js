const map = document.querySelector("#map");
map.textContent = "Hello";

fetch("http://10.0.0.238:3000")
.then((response) => {
    return response.json();
})
.then((feed) => {
    map.textContent = JSON.stringify(feed);
});
