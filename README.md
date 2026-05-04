# Nat20 Prefixer

Расширение для **Visual Studio Code** и **Cursor**: актуальные **вендорные префиксы CSS** (через [Autoprefixer](https://github.com/postcss/autoprefixer) и [Browserslist](https://github.com/browserslist/browserslist)), снятие префиксов, дополнительная логика `opacity` / `visibility` в `@keyframes`.

## Возможности

- Добавление префиксов по целевым браузерам (строка Browserslist в настройках).
- Поддержка **CSS**, **SCSS**, **Less**, **PostCSS**, режима **Tailwind CSS**.
- Внутри `@keyframes`: для `opacity: 1` / `opacity: 0` выставляется `visibility: visible` / `hidden` (при необходимости).
- Команды **снятия** префиксов с имён свойств и нормализация `@-*-keyframes` → `@keyframes`.

## Команды

| Команда | Описание |
|--------|----------|
| **Nat20: добавить префиксы в файл** | Весь файл |
| **Nat20: добавить префиксы в выделение** | Только выделение |
| **Nat20: убрать вендорные префиксы в файле** | Снять префиксы во всём файле |
| **Nat20: убрать вендорные префиксы в выделении** | Снять префиксы в выделении |

Откройте палитру команд: `Ctrl+Shift+P` (Windows / Linux) или `Cmd+Shift+P` (macOS), введите `Nat20`.

## Настройки

| Ключ | По умолчанию | Описание |
|------|----------------|----------|
| `nat20Prefixer.browserslist` | `> 0.5%, last 2 versions, Firefox ESR, not dead` | Запрос Browserslist для Autoprefixer |
| `nat20Prefixer.prefixOnSave` | `false` | Добавлять префиксы при сохранении |

## Git и GitHub

Исходники: [shahnazaryan0330/nat20-prefixer](https://github.com/shahnazaryan0330/nat20-prefixer) (`repository` / `bugs` / `homepage` в `package.json` совпадают с этим URL).

Первый push в пустой репозиторий:

```bash
git remote add origin https://github.com/shahnazaryan0330/nat20-prefixer.git
git branch -M main
git push -u origin main
```

Если `origin` уже был добавлен с другим адресом:

```bash
git remote set-url origin https://github.com/shahnazaryan0330/nat20-prefixer.git
git push -u origin main
```

## Разработка

```bash
npm install
npm run compile
```

Запуск в отладочном окне: **F5** (конфигурация «Run Extension» в `.vscode/launch.json`).

Сборка установочного пакета:

```bash
npm run package
```

В корне появится файл `nat20-prefixer-0.1.0.vsix` (версия из `package.json`).

`vsce` может вывести предупреждение о большом числе файлов (данные `caniuse-lite` у Autoprefixer) — на работу расширения это не влияет; позже размер можно уменьшить сборкой в один бандл (esbuild / `@vercel/ncc`).

## Публикация в Visual Studio Marketplace

1. **Учётная запись Microsoft** и [создание издателя (publisher)](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher) на [странице управления Marketplace](https://marketplace.visualstudio.com/manage). Идентификатор издателя должен совпадать с полем `"publisher"` в `package.json` (сейчас `nat20`). Если имя занято — смените `publisher` и заново выполните шаги ниже.

2. **Personal Access Token (PAT)** в Azure DevOps с правом **Marketplace (Manage)** / **Acquire** / **Publish** — [инструкция Microsoft](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token).

3. Установите зависимости и войдите CLI (один раз):

   ```bash
   npm install
   npx vsce login nat20
   ```

   Вставьте PAT, когда будет запрошен.

4. Публикация новой версии:

   ```bash
   npm run compile
   npm run publish:marketplace
   ```

   Перед этим увеличьте `"version"` в `package.json` по правилам [semver](https://semver.org/) для каждого нового релиза. Поля `repository` / `bugs` / `homepage` уже указывают на GitHub — при смене URL обновите их вместе.

Подробности: [Publishing Extensions | VS Code API](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

## Лицензия

MIT — см. файл `LICENSE` в корне репозитория / пакета.
