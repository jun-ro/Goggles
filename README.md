
![Logo](https://raw.githubusercontent.com/jun-ro/Goggles/main/readme/GogglesBannerGit.png)


## Installation

You can install [Goggles](https://github.com/jun-ro/Goggles.git) using this:

```bash
  npm install goggles.js
```
    
## API 

#### Get all items

```js
  getGradebook(username, password)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Required**. Your StudentVUE Username. |
| `password` | `string` | **Required**. Your StudentVUE Password. |


#### Get item

```js
  getAssignmentDetails(username, password, guid);
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `username`      | `string` | **Required**. Your StudentVue Username. |
| `password`      | `string` | **Required**. Your StudentVue Password |
| `guid`      | `string` | **Required**. Your class "GUID", you can find it in getGradebook() |

#### add(num1, num2)

Takes two numbers and returns the sum.


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

