[![showalicense.com](http://i.imgur.com/DEYIE8P.png)](http://showalicense.com/)

# showalicense.com [![Support this project][donate-now]][paypal-donations]

A site to provide an easy way to show licenses and their human-readable explanations.

## Your help is needed! :heart:

Contribute by explaining licenses. Check out [this issue](https://github.com/IonicaBizau/showalicense.com/issues/1). :memo: :book:

## Usage

Whether you just want to show a license or see its human-readable explanation, you can use this website. It provides a nice querystring API documented below:

 - `#license-<license>` (hash): set the license to display
 - `fullname=<name>`: set the copyright holder name
 - `year=<name>`: set the starting copyright yea
 - `hide_explanations=<true|false>` (default: `false`): hide the explanations column

[![showalicense.com](http://i.imgur.com/DikgR8H.png)](http://showalicense.com/)

## Examples

 - To see the MIT license access this url: http://showalicense.com/#license-mit
 - To set the copyright holder name, use the `fullname=<name>` querystring parameter: http://showalicense.com/?fullname=Alice#license-mit
 - To set the starting copyright year use the `year` parameter: http://showalicense.com/?year=2013&fullname=Alice#license-mit
 - To hide the explanations column, you have to use `hide_explanations=true`: http://showalicense.com/?hide_explanations=true&year=2013&fullname=Alice#license-mit

## How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].

### Explaining a license

Explanations are kept in `txt` files in the [`explanations`](/explanations) directory, having the license names (e.g. `mit.txt`).

Contributions in this directions are really appreciated.

 1. Fork this repository.
 2. Edit the `explanations/<license>.txt` file (you can follow [`explanations/mit.txt`](/explanations/mit.txt) as example).
 3. Add yourself as contributor in [`package.json`](/package.json).
 4. Raise a pull request! :tada:

### Adding a new license

If the license you're searching for is missing, make sure you add it.

 1. Fork this repository.
 2. Add a new file in the [`licenses`](/licenses) directory, named `<license>.txt` (replace `<license>` with the license name) and then do the same in the [`explanations`](/explanations) directory (you can follow the MIT license example: see [`explanations/mit.txt`](/explanations/mit.txt) and [`licenses/mit.txt`](/licenses/mit.txt)).
 3. Give nice, funny and useful explanation in the `explanations/<license>.txt` file you added.
 4. Add yourself as contributor in [`package.json`](/package.json).
 5. Raise a pull request! :tada:

## Thanks

 - [github/choosealicense.com](https://github.com/github/choosealicense.com)–a good inspiration source (some ideas and CSS were taken from here) :sparkle:
 - [**@Cerberus-tm**](https://github.com/Cerberus-tm)–who had the idea for the site name :cake:

## License

[MIT][license] © [Ionică Bizău][website]

[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW
[donate-now]: http://i.imgur.com/6cMbHOC.png

[license]: http://showalicense.com/?fullname=Ionic%C4%83%20Biz%C4%83u%20%3Cbizauionica%40gmail.com%3E%20(http%3A%2F%2Fionicabizau.net)&year=2015#license-mit
[website]: http://ionicabizau.net
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md