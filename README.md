# Adonis Database Encryption

<br>

[![gh-workflow-image]][gh-workflow-url] [![npm-image]][npm-url] [![npm-downloads]][npm-downloads] ![][typescript-image] [![license-image]][license-url]

Database Encryption is a feature that allows developers to store data with encrypted and consume again with data decrypted. This feature provides a structured and organized approach to managing application database, making it easier to query.

## Installation

```sh
node ace add @adityadarma/adonis-database-cryptable
```

## Usage

### Configuration

You can configuration encryption data from file config. for now only support `mysql or mariadb` database.

```ts
import { defineConfig } from '@adityadarma/adonis-database-cryptable/define_config'
import env from '#start/env'

const cryptableConfig = defineConfig({
  key: env.get('APP_KEY'),
  default: 'mysql',
  drivers: ['mysql'],
})
export default cryptableConfig
```

### Adding to Model

You can choise what column will you encrypt with decorator `@columnCryptable()`.

```ts
@columnCryptable()
declare name: string

@columnCryptable()
declare email: string

@column()
declare emailVerifiedAt: DateTime
```

### Searching Encrypted Fields Example:

Searching encrypted field can be done by calling the `whereEncrypted` and `orWhereEncrypted` functions
similar to laravel eloquent `where` and `orWhere`. Ordering encrypted data can be calling `orderByEncrypted` laravel eloquent `orderBy`.

```ts
export default class UsersController {
  async index() {
    const user = await User.query()
      .whereEncrypted('first_name', 'john')
      .orWhereEncrypted('last_name', '!=', 'Doe')
      .orderByEncrypted('last_name', 'asc')
      .first()

    return user
  }
}
```

### Validate value

Validate data encrypted in database in VineJS. You can apply on `unique` or `exists` method.

```ts
export const updateUserValidator = vine
  .compile(
    vine.object({
      email: vine.string().unique(async (db, value, field) => {
        const user = await db
          .from('users')
          .whereNot('id', field.meta.userId)
          .whereEncrypted('email', value)
          .first()
        return !user
      })
    })
  )
```

## Credits

This package was inspired from the following:

- [elgiborsolution/laravel-database-encryption](https://github.com/elgiborsolution/laravel-database-encryption)

## License

Adonis Datatables is open-sourced software licensed under the [MIT license](LICENSE.md).

[gh-workflow-image]: https://img.shields.io/github/actions/workflow/status/adityadarma/adonis-database-cryptable/release.yml?style=for-the-badge
[gh-workflow-url]: https://github.com/adityadarma/adonis-database-cryptable/actions/workflows/release.yml 'Github action'
[npm-image]: https://img.shields.io/npm/v/@adityadarma/adonis-database-cryptable/latest.svg?style=for-the-badge&logo=npm
[npm-url]: https://www.npmjs.com/package/@adityadarma/adonis-database-cryptable/v/latest 'npm'
[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[license-url]: LICENSE.md
[license-image]: https://img.shields.io/github/license/adityadarma/adonis-database-cryptable?style=for-the-badge
[npm-downloads]: https://img.shields.io/npm/dm/@adityadarma/adonis-database-cryptable.svg?style=for-the-badge
[count-downloads]: https://npmcharts.com/compare/@adityadarma/adonis-database-cryptable?minimal=true
