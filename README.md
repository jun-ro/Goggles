
![Logo](https://raw.githubusercontent.com/jun-ro/Goggles/main/readme/GogglesBannerGit.png)

*"Just a botchy StudentVUE scraper..."* -Jun-ro.

## Todo

- Optimize the code to be less messy ❌
- Account for other school districts within the StudentVUE system ❌

## Installation

You can install [Goggles](https://github.com/jun-ro/Goggles.git) with these steps:
- Install Puppeteer `npm install puppeteer`
- Download "Goggles.js" from this repo and place it in your editor.


    
## API

#### Scrape the "Gradebook"

```js
  getGradebook(username, password)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Required**. Your StudentVUE Username. |
| `password` | `string` | **Required**. Your StudentVUE Password. |


#### Scrape assignment details.

```js
  getAssignmentDetails(username, password, guid);
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `username`      | `string` | **Required**. Your StudentVue Username. |
| `password`      | `string` | **Required**. Your StudentVue Password |
| `guid`      | `string` | **Required**. Your class "GUID", you can find it in getGradebook() |


## Usage/Examples

```javascript
const StudentVueAPI = require('./StudentVueAPI');
const StudentVue = new StudentVueAPI();

console.log(await StudentVue.getGradebook(username, password));
```


## Features

- Scraping your `Gradebook` to find your class and grade for the class.
- Scraping your assignments for the class.


# Acknowledgments

- [Puppeteer](https://pptr.dev/)
## License

[MIT](https://choosealicense.com/licenses/mit/)

