# Clean Code TypeScript

> Software engineering principles, from Robert C. Martin's book Clean Code, adapted for TypeScript. This is not a style guide. It's a guide to producing readable, reusable, and refactorable software in TypeScript.

## Introduction

Not every principle herein has to be strictly followed, and even fewer will be universally agreed upon. These are guidelines and nothing more, but they are ones codified over many years of collective experience by the authors of Clean Code.

Our craft of software engineering is just a bit over 50 years old, and we are still learning a lot. When software architecture is as old as architecture itself, maybe then we will have harder rules to follow. For now, let these guidelines serve as a touchstone by which to assess the quality of the TypeScript code that you and your team produce.

One more thing: knowing these won't immediately make you a better software developer, and working with them for many years doesn't mean you won't make mistakes. Every piece of code starts as a first draft, like wet clay getting shaped into its final form. Finally, we chisel away the imperfections when we review it with our peers. Don't beat yourself up for first drafts that need improvement. Beat up the code instead!

## Table of Contents

1. [Variables](#variables)
2. [Functions](#functions)
3. [Objects and Data Structures](#objects-and-data-structures)
4. [Classes](#classes)
5. [SOLID](#solid)
6. [Testing](#testing)
7. [Concurrency](#concurrency)
8. [Error Handling](#error-handling)
9. [Formatting](#formatting)
10. [Comments](#comments)

## Variables

### Use meaningful variable names

Distinguish names in such a way that the reader knows what the differences offer.

**Bad:**
```typescript
function between<T>(a1: T, a2: T, a3: T): boolean { 
  return a2 <= a1 && a1 <= a3; 
}
```

**Good:**
```typescript
function between<T>(value: T, left: T, right: T): boolean { 
  return left <= value && value <= right; 
}
```

### Use pronounceable variable names

If you can't pronounce it, you can't discuss it without sounding like an idiot.

**Bad:**
```typescript
type DtaRcrd102 = { genymdhms: Date; modymdhms: Date; pszqint: number; }
```

**Good:**
```typescript
type Customer = { generationTimestamp: Date; modificationTimestamp: Date; recordId: number; }
```

### Use the same vocabulary for the same type of variable

**Bad:**
```typescript
function getUserInfo(): User; 
function getUserDetails(): User; 
function getUserData(): User;
```

**Good:**
```typescript
function getUser(): User;
```

### Use searchable names

We will read more code than we will ever write. It's important that the code we do write must be readable and searchable.

**Bad:**
```typescript
// What the heck is 86400000 for?
setTimeout(restart, 86400000);
```

**Good:**
```typescript
// Declare them as capitalized named constants.
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000; // 86400000
setTimeout(restart, MILLISECONDS_PER_DAY);
```

### Use explanatory variables

**Bad:**
```typescript
declare const users: Map<string, User>;
for (const keyValue of users) {
  // iterate through users map
}
```

**Good:**
```typescript
declare const users: Map<string, User>;
for (const [id, user] of users) {
  // iterate through users map
}
```

### Avoid Mental Mapping

Explicit is better than implicit. Clarity is king.

**Bad:**
```typescript
const u = getUser(); 
const s = getSubscription(); 
const t = charge(u, s);
```

**Good:**
```typescript
const user = getUser(); 
const subscription = getSubscription(); 
const transaction = charge(user, subscription);
```

### Don't add unneeded context

If your class/type/object name tells you something, don't repeat that in your variable name.

**Bad:**
```typescript
type Car = { 
  carMake: string; 
  carModel: string; 
  carColor: string; 
}
function print(car: Car): void { 
  console.log(`${car.carMake} ${car.carModel} (${car.carColor})`); 
}
```

**Good:**
```typescript
type Car = { 
  make: string; 
  model: string; 
  color: string; 
}
function print(car: Car): void { 
  console.log(`${car.make} ${car.model} (${car.color})`); 
}
```

### Use default arguments instead of short circuiting or conditionals

Default arguments are often cleaner than short circuiting.

**Bad:**
```typescript
function loadPages(count?: number) { 
  const loadCount = count !== undefined ? count : 10; 
  // ... 
}
```

**Good:**
```typescript
function loadPages(count: number = 10) { 
  // ... 
}
```

### Use enum to document the intent

Enums can help you document the intent of the code.

**Bad:**
```typescript
const GENRE = { 
  ROMANTIC: 'romantic', 
  DRAMA: 'drama', 
  COMEDY: 'comedy', 
  DOCUMENTARY: 'documentary', 
}
projector.configureFilm(GENRE.COMEDY);
```

**Good:**
```typescript
enum GENRE { 
  ROMANTIC, 
  DRAMA, 
  COMEDY, 
  DOCUMENTARY, 
}
projector.configureFilm(GENRE.COMEDY);
```

## Functions

### Function arguments (2 or fewer ideally)

Limiting the number of function parameters is incredibly important because it makes testing your function easier. Having more than three leads to a combinatorial explosion where you have to test tons of different cases with each separate argument.

**Bad:**
```typescript
function createMenu(title: string, body: string, buttonText: string, cancellable: boolean) {
  // ... 
}
createMenu('Foo', 'Bar', 'Baz', true);
```

**Good:**
```typescript
type MenuOptions = { 
  title: string, 
  body: string, 
  buttonText: string, 
  cancellable: boolean 
};

function createMenu(options: MenuOptions) {
  // ... 
}
createMenu({ title: 'Foo', body: 'Bar', buttonText: 'Baz', cancellable: true });
```

### Functions should do one thing

This is by far the most important rule in software engineering. When functions do more than one thing, they are harder to compose, test, and reason about.

**Bad:**
```typescript
function emailActiveClients(clients: Client[]) {
  clients.forEach((client) => {
    const clientRecord = database.lookup(client);
    if (clientRecord.isActive()) {
      email(client);
    }
  });
}
```

**Good:**
```typescript
function emailActiveClients(clients: Client[]) {
  clients.filter(isActiveClient).forEach(email);
}

function isActiveClient(client: Client) {
  const clientRecord = database.lookup(client);
  return clientRecord.isActive();
}
```

### Function names should say what they do

**Bad:**
```typescript
function addToDate(date: Date, month: number): Date {
  // ... 
}
const date = new Date();
// It's hard to tell from the function name what is added
addToDate(date, 1);
```

**Good:**
```typescript
function addMonthToDate(date: Date, month: number): Date {
  // ... 
}
const date = new Date();
addMonthToDate(date, 1);
```

### Functions should only be one level of abstraction

When you have more than one level of abstraction your function is usually doing too much. Splitting up functions leads to reusability and easier testing.

**Bad:**
```typescript
function parseCode(code: string) {
  const REGEXES = [ /* ... */ ];
  const statements = code.split(' ');
  const tokens = [];
  
  REGEXES.forEach((regex) => {
    statements.forEach((statement) => {
      // ...
    });
  });
  
  const ast = [];
  tokens.forEach((token) => {
    // lex...
  });
  
  ast.forEach((node) => {
    // parse...
  });
}
```

**Good:**
```typescript
const REGEXES = [ /* ... */ ];

function parseCode(code: string) {
  const tokens = tokenize(code);
  const syntaxTree = parse(tokens);
  syntaxTree.forEach((node) => {
    // parse...
  });
}

function tokenize(code: string): Token[] {
  const statements = code.split(' ');
  const tokens: Token[] = [];
  REGEXES.forEach((regex) => {
    statements.forEach((statement) => {
      tokens.push(/* ... */);
    });
  });
  return tokens;
}

function parse(tokens: Token[]): SyntaxTree {
  const syntaxTree: SyntaxTree[] = [];
  tokens.forEach((token) => {
    syntaxTree.push(/* ... */);
  });
  return syntaxTree;
}
```

### Remove duplicate code

Do your absolute best to avoid duplicate code. Duplicate code is bad because it means that there's more than one place to alter something if you need to change some logic.

**Bad:**
```typescript
function showDeveloperList(developers: Developer[]) {
  developers.forEach((developer) => {
    const expectedSalary = developer.calculateExpectedSalary();
    const experience = developer.getExperience();
    const githubLink = developer.getGithubLink();
    const data = { expectedSalary, experience, githubLink };
    render(data);
  });
}

function showManagerList(managers: Manager[]) {
  managers.forEach((manager) => {
    const expectedSalary = manager.calculateExpectedSalary();
    const experience = manager.getExperience();
    const portfolio = manager.getMBAProjects();
    const data = { expectedSalary, experience, portfolio };
    render(data);
  });
}
```

**Good:**
```typescript
class Developer {
  // ...
  getExtraDetails() {
    return { githubLink: this.githubLink };
  }
}

class Manager {
  // ...
  getExtraDetails() {
    return { portfolio: this.portfolio };
  }
}

function showEmployeeList(employee: (Developer | Manager)[]) {
  employee.forEach((employee) => {
    const expectedSalary = employee.calculateExpectedSalary();
    const experience = employee.getExperience();
    const extra = employee.getExtraDetails();
    const data = { expectedSalary, experience, extra };
    render(data);
  });
}
```

### Set default objects with Object.assign or destructuring

**Bad:**
```typescript
type MenuConfig = { 
  title?: string, 
  body?: string, 
  buttonText?: string, 
  cancellable?: boolean 
};

function createMenu(config: MenuConfig) {
  config.title = config.title || 'Foo';
  config.body = config.body || 'Bar';
  config.buttonText = config.buttonText || 'Baz';
  config.cancellable = config.cancellable !== undefined ? config.cancellable : true;
  // ... 
}
createMenu({ body: 'Bar' });
```

**Good:**
```typescript
type MenuConfig = { 
  title?: string, 
  body?: string, 
  buttonText?: string, 
  cancellable?: boolean 
};

function createMenu(config: MenuConfig) {
  const menuConfig = { 
    title: 'Foo', 
    body: 'Bar', 
    buttonText: 'Baz', 
    cancellable: true, 
    ...config, 
  };
  // ... 
}
createMenu({ body: 'Bar' });
```

### Don't use flags as function parameters

Flags tell your user that this function does more than one thing. Functions should do one thing.

**Bad:**
```typescript
function createFile(name: string, temp: boolean) {
  if (temp) {
    fs.create(`./temp/${name}`);
  } else {
    fs.create(name);
  }
}
```

**Good:**
```typescript
function createTempFile(name: string) {
  createFile(`./temp/${name}`);
}

function createFile(name: string) {
  fs.create(name);
}
```

### Avoid Side Effects

A function produces a side effect if it does anything other than take a value in and return another value or values.

**Bad:**
```typescript
// Global variable referenced by following function.
let name = 'Robert C. Martin';

function toBase64() {
  name = btoa(name);
}

toBase64(); // If we had another function that used this name, now it'd be a Base64 value
console.log(name); // expected to print 'Robert C. Martin' but instead 'Um9iZXJ0IEMuIE1hcnRpbg=='
```

**Good:**
```typescript
const name = 'Robert C. Martin';

function toBase64(text: string): string {
  return btoa(text);
}

const encodedName = toBase64(name);
console.log(name);
```

**Bad (mutating function arguments):**
```typescript
function addItemToCart(cart: CartItem[], item: Item): void { 
  cart.push({ item, date: Date.now() }); 
}
```

**Good:**
```typescript
function addItemToCart(cart: CartItem[], item: Item): CartItem[] { 
  return [...cart, { item, date: Date.now() }]; 
}
```

### Don't write to global functions

Polluting globals is a bad practice in JavaScript because you could clash with another library.

**Bad:**
```typescript
declare global { 
  interface Array<T> { 
    diff(other: T[]): Array<T>; 
  } 
}

if (!Array.prototype.diff) {
  Array.prototype.diff = function <T>(other: T[]): T[] {
    const hash = new Set(other);
    return this.filter(elem => !hash.has(elem));
  };
}
```

**Good:**
```typescript
class MyArray<T> extends Array<T> {
  diff(other: T[]): T[] {
    const hash = new Set(other);
    return this.filter(elem => !hash.has(elem));
  }
}
```

### Favor functional programming over imperative programming

**Bad:**
```typescript
const contributions = [
  { name: 'Uncle Bobby', linesOfCode: 500 },
  { name: 'Suzie Q', linesOfCode: 1500 },
  { name: 'Jimmy Gosling', linesOfCode: 150 },
  { name: 'Gracie Hopper', linesOfCode: 1000 }
];

let totalOutput = 0;
for (let i = 0; i < contributions.length; i++) {
  totalOutput += contributions[i].linesOfCode;
}
```

**Good:**
```typescript
const contributions = [
  { name: 'Uncle Bobby', linesOfCode: 500 },
  { name: 'Suzie Q', linesOfCode: 1500 },
  { name: 'Jimmy Gosling', linesOfCode: 150 },
  { name: 'Gracie Hopper', linesOfCode: 1000 }
];

const totalOutput = contributions
  .reduce((totalLines, output) => totalLines + output.linesOfCode, 0);
```

### Encapsulate conditionals

**Bad:**
```typescript
if (subscription.isTrial || account.balance > 0) {
  // ...
}
```

**Good:**
```typescript
function canActivateService(subscription: Subscription, account: Account) {
  return subscription.isTrial || account.balance > 0;
}

if (canActivateService(subscription, account)) {
  // ...
}
```

### Avoid negative conditionals

**Bad:**
```typescript
function isEmailNotUsed(email: string): boolean {
  // ... 
}
if (isEmailNotUsed(email)) {
  // ...
}
```

**Good:**
```typescript
function isEmailUsed(email: string): boolean {
  // ... 
}
if (!isEmailUsed(email)) {
  // ...
}
```

### Avoid conditionals

This seems like an impossible task. You can use polymorphism to achieve the same task in many cases.

**Bad:**
```typescript
class Airplane {
  private type: string;
  // ...
  getCruisingAltitude() {
    switch (this.type) {
      case '777':
        return this.getMaxAltitude() - this.getPassengerCount();
      case 'Air Force One':
        return this.getMaxAltitude();
      case 'Cessna':
        return this.getMaxAltitude() - this.getFuelExpenditure();
      default:
        throw new Error('Unknown airplane type.');
    }
  }
  
  private getMaxAltitude(): number {
    // ...
  }
}
```

**Good:**
```typescript
abstract class Airplane {
  protected getMaxAltitude(): number {
    // shared logic with subclasses
    // ...
  }
  // ...
}

class Boeing777 extends Airplane {
  // ...
  getCruisingAltitude() {
    return this.getMaxAltitude() - this.getPassengerCount();
  }
}

class AirForceOne extends Airplane {
  // ...
  getCruisingAltitude() {
    return this.getMaxAltitude();
  }
}

class Cessna extends Airplane {
  // ...
  getCruisingAltitude() {
    return this.getMaxAltitude() - this.getFuelExpenditure();
  }
}
```

### Avoid type checking

TypeScript is a strict syntactical superset of JavaScript and adds optional static type checking to the language.

**Bad:**
```typescript
function travelToTexas(vehicle: Bicycle | Car) {
  if (vehicle instanceof Bicycle) {
    vehicle.pedal(currentLocation, new Location('texas'));
  } else if (vehicle instanceof Car) {
    vehicle.drive(currentLocation, new Location('texas'));
  }
}
```

**Good:**
```typescript
type Vehicle = Bicycle | Car;

function travelToTexas(vehicle: Vehicle) {
  vehicle.move(currentLocation, new Location('texas'));
}
```

### Don't over-optimize

Modern browsers do a lot of optimization under-the-hood at runtime.

**Bad:**
```typescript
// On old browsers, each iteration with uncached `list.length` would be costly
// because of `list.length` recomputation. In modern browsers, this is optimized.
for (let i = 0, len = list.length; i < len; i++) {
  // ...
}
```

**Good:**
```typescript
for (let i = 0; i < list.length; i++) {
  // ...
}
```

### Remove dead code

Dead code is just as bad as duplicate code. There's no reason to keep it in your codebase.

**Bad:**
```typescript
function oldRequestModule(url: string) {
  // ... 
}

function requestModule(url: string) {
  // ... 
}

const req = requestModule;
inventoryTracker('apples', req, 'www.inventory-awesome.io');
```

**Good:**
```typescript
function requestModule(url: string) {
  // ... 
}

const req = requestModule;
inventoryTracker('apples', req, 'www.inventory-awesome.io');
```

### Use iterators and generators

Use generators and iterables when working with collections of data used like a stream.

**Bad:**
```typescript
function fibonacci(n: number): number[] {
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  
  const items: number[] = [0, 1];
  while (items.length < n) {
    items.push(items[items.length - 2] + items[items.length - 1]);
  }
  
  return items;
}

function print(n: number) {
  fibonacci(n).forEach(fib => console.log(fib));
}

// Print first 10 Fibonacci numbers.
print(10);
```

**Good:**
```typescript
// Generates an infinite stream of Fibonacci numbers.
// The generator doesn't keep the array of all numbers.
function* fibonacci(): IterableIterator<number> {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

function print(n: number) {
  let i = 0;
  for (const fib of fibonacci()) {
    if (i++ === n) break;
    console.log(fib);
  }
}

// Print first 10 Fibonacci numbers.
print(10);
```

## Objects and Data Structures

### Use getters and setters

Using getters and setters to access data from objects that encapsulate behavior could be better than simply looking for a property on an object.

**Bad:**
```typescript
type BankAccount = { 
  balance: number; 
  // ... 
}

const value = 100;
const account: BankAccount = { balance: 0, /* ... */ };

if (value < 0) {
  throw new Error('Cannot set negative balance.');
}

account.balance = value;
```

**Good:**
```typescript
class BankAccount {
  private accountBalance: number = 0;

  get balance(): number {
    return this.accountBalance;
  }

  set balance(value: number) {
    if (value < 0) {
      throw new Error('Cannot set negative balance.');
    }
    this.accountBalance = value;
  }
  // ...
}

// Now `BankAccount` encapsulates the validation logic.
const account = new BankAccount();
account.balance = 100;
```

### Make objects have private/protected members

TypeScript supports public (default), protected and private accessors on class members.

**Bad:**
```typescript
class Circle {
  radius: number;
  
  constructor(radius: number) {
    this.radius = radius;
  }
  
  perimeter() {
    return 2 * Math.PI * this.radius;
  }
  
  surface() {
    return Math.PI * this.radius * this.radius;
  }
}
```

**Good:**
```typescript
class Circle {
  constructor(private readonly radius: number) { }
  
  perimeter() {
    return 2 * Math.PI * this.radius;
  }
  
  surface() {
    return Math.PI * this.radius * this.radius;
  }
}
```

### Prefer immutability

TypeScript's type system allows you to mark individual properties on an interface/class as readonly.

**Bad:**
```typescript
interface Config {
  host: string;
  port: string;
  db: string;
}
```

**Good:**
```typescript
interface Config {
  readonly host: string;
  readonly port: string;
  readonly db: string;
}
```

For arrays, you can create a read-only array by using ReadonlyArray<T>.

**Bad:**
```typescript
const array: number[] = [1, 3, 5];
array = []; // error
array.push(100); // array will be updated
```

**Good:**
```typescript
const array: ReadonlyArray<number> = [1, 3, 5];
array = []; // error
array.push(100); // error
```

### type vs. interface

Use type when you might need a union or intersection. Use an interface when you want extends or implements.

**Bad:**
```typescript
interface EmailConfig { /* ... */ }
interface DbConfig { /* ... */ }
interface Config { /* ... */ }
//...
type Shape = { /* ... */ }
```

**Good:**
```typescript
type EmailConfig = { /* ... */ }
type DbConfig = { /* ... */ }
type Config = EmailConfig | DbConfig;

// ...
interface Shape { /* ... */ }

class Circle implements Shape { /* ... */ }
class Square implements Shape { /* ... */ }
```

## Classes

### Classes should be small

The class' size is measured by its responsibility. Following the Single Responsibility principle a class should be small.

**Bad:**
```typescript
class Dashboard {
  getLanguage(): string { /* ... */ }
  setLanguage(language: string): void { /* ... */ }
  showProgress(): void { /* ... */ }
  hideProgress(): void { /* ... */ }
  isDirty(): boolean { /* ... */ }
  disable(): void { /* ... */ }
  enable(): void { /* ... */ }
  addSubscription(subscription: Subscription): void { /* ... */ }
  removeSubscription(subscription: Subscription): void { /* ... */ }
  addUser(user: User): void { /* ... */ }
  removeUser(user: User): void { /* ... */ }
  goToHomePage(): void { /* ... */ }
  updateProfile(details: UserDetails): void { /* ... */ }
  getVersion(): string { /* ... */ }
  // ...
}
```

**Good:**
```typescript
class Dashboard {
  disable(): void { /* ... */ }
  enable(): void { /* ... */ }
  getVersion(): string { /* ... */ }
}

// split the responsibilities by moving the remaining methods to other classes
// ...
```

### High cohesion and low coupling

Cohesion defines the degree to which class members are related to each other. Coupling refers to how related or dependent are two classes toward each other.

**Bad:**
```typescript
class UserManager {
  // Bad: each private variable is used by one or another group of methods.
  constructor(
    private readonly db: Database,
    private readonly emailSender: EmailSender
  ) { }
  
  async getUser(id: number): Promise<User> {
    return await this.db.users.findOne({ id });
  }
  
  async getTransactions(userId: number): Promise<Transaction[]> {
    return await this.db.transactions.find({ userId });
  }
  
  async sendGreeting(): Promise<void> {
    await this.emailSender.send('Welcome!');
  }
  
  async sendNotification(text: string): Promise<void> {
    await this.emailSender.send(text);
  }
  
  async sendNewsletter(): Promise<void> {
    // ...
  }
}
```

**Good:**
```typescript
class UserService {
  constructor(private readonly db: Database) { }
  
  async getUser(id: number): Promise<User> {
    return await this.db.users.findOne({ id });
  }
  
  async getTransactions(userId: number): Promise<Transaction[]> {
    return await this.db.transactions.find({ userId });
  }
}

class UserNotifier {
  constructor(private readonly emailSender: EmailSender) { }
  
  async sendGreeting(): Promise<void> {
    await this.emailSender.send('Welcome!');
  }
  
  async sendNotification(text: string): Promise<void> {
    await this.emailSender.send(text);
  }
  
  async sendNewsletter(): Promise<void> {
    // ...
  }
}
```

### Prefer composition over inheritance

As stated famously in Design Patterns by the Gang of Four, you should prefer composition over inheritance where you can.

**Bad:**
```typescript
class Employee {
  constructor(
    private readonly name: string,
    private readonly email: string
  ) { }
  // ...
}

// Bad because Employees "have" tax data. EmployeeTaxData is not a type of Employee
class EmployeeTaxData extends Employee {
  constructor(
    name: string,
    email: string,
    private readonly ssn: string,
    private readonly salary: number
  ) {
    super(name, email);
  }
  // ...
}
```

**Good:**
```typescript
class Employee {
  private taxData: EmployeeTaxData;
  
  constructor(
    private readonly name: string,
    private readonly email: string
  ) { }
  
  setTaxData(ssn: string, salary: number): Employee {
    this.taxData = new EmployeeTaxData(ssn, salary);
    return this;
  }
  // ...
}

class EmployeeTaxData {
  constructor(
    public readonly ssn: string,
    public readonly salary: number
  ) { }
  // ...
}
```

### Use method chaining

This pattern is very useful and commonly used in many libraries. It allows your code to be expressive, and less verbose.

**Bad:**
```typescript
class QueryBuilder {
  private collection: string;
  private pageNumber: number = 1;
  private itemsPerPage: number = 100;
  private orderByFields: string[] = [];
  
  from(collection: string): void {
    this.collection = collection;
  }
  
  page(number: number, itemsPerPage: number = 100): void {
    this.pageNumber = number;
    this.itemsPerPage = itemsPerPage;
  }
  
  orderBy(...fields: string[]): void {
    this.orderByFields = fields;
  }
  
  build(): Query {
    // ...
  }
}

// ...
const queryBuilder = new QueryBuilder();
queryBuilder.from('users');
queryBuilder.page(1, 100);
queryBuilder.orderBy('firstName', 'lastName');
const query = queryBuilder.build();
```

**Good:**
```typescript
class QueryBuilder {
  private collection: string;
  private pageNumber: number = 1;
  private itemsPerPage: number = 100;
  private orderByFields: string[] = [];
  
  from(collection: string): this {
    this.collection = collection;
    return this;
  }
  
  page(number: number, itemsPerPage: number = 100): this {
    this.pageNumber = number;
    this.itemsPerPage = itemsPerPage;
    return this;
  }
  
  orderBy(...fields: string[]): this {
    this.orderByFields = fields;
    return this;
  }
  
  build(): Query {
    // ...
  }
}

// ...
const query = new QueryBuilder()
  .from('users')
  .page(1, 100)
  .orderBy('firstName', 'lastName')
  .build();
```

## SOLID

### Single Responsibility Principle (SRP)

As stated in Clean Code, "There should never be more than one reason for a class to change".

**Bad:**
```typescript
class UserSettings {
  constructor(private readonly user: User) { }
  
  changeSettings(settings: UserSettings) {
    if (this.verifyCredentials()) {
      // ...
    }
  }
  
  verifyCredentials() {
    // ...
  }
}
```

**Good:**
```typescript
class UserAuth {
  constructor(private readonly user: User) { }
  
  verifyCredentials() {
    // ...
  }
}

class UserSettings {
  private readonly auth: UserAuth;
  
  constructor(private readonly user: User) {
    this.auth = new UserAuth(user);
  }
  
  changeSettings(settings: UserSettings) {
    if (this.auth.verifyCredentials()) {
      // ...
    }
  }
}
```

### Open/Closed Principle (OCP)

Software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification.

**Bad:**
```typescript
class AjaxAdapter extends Adapter {
  constructor() { super(); }
  // ...
}

class NodeAdapter extends Adapter {
  constructor() { super(); }
  // ...
}

class HttpRequester {
  constructor(private readonly adapter: Adapter) { }
  
  async fetch<T>(url: string): Promise<T> {
    if (this.adapter instanceof AjaxAdapter) {
      const response = await makeAjaxCall<T>(url);
      // transform response and return
    } else if (this.adapter instanceof NodeAdapter) {
      const response = await makeHttpCall<T>(url);
      // transform response and return
    }
  }
}
```

**Good:**
```typescript
abstract class Adapter {
  abstract async request<T>(url: string): Promise<T>;
  // code shared to subclasses
  // ...
}

class AjaxAdapter extends Adapter {
  constructor() { super(); }
  
  async request<T>(url: string): Promise<T>{
    // request and return promise
  }
  // ...
}

class NodeAdapter extends Adapter {
  constructor() { super(); }
  
  async request<T>(url: string): Promise<T>{
    // request and return promise
  }
  // ...
}

class HttpRequester {
  constructor(private readonly adapter: Adapter) { }
  
  async fetch<T>(url: string): Promise<T> {
    const response = await this.adapter.request<T>(url);
    // transform response and return
  }
}
```

### Liskov Substitution Principle (LSP)

If S is a subtype of T, then objects of type T may be replaced with objects of type S without altering any of the desirable properties of that program.

**Bad:**
```typescript
class Rectangle {
  constructor(
    protected width: number = 0,
    protected height: number = 0
  ) { }
  
  setColor(color: string): this { /* ... */ }
  render(area: number) { /* ... */ }
  
  setWidth(width: number): this {
    this.width = width;
    return this;
  }
  
  setHeight(height: number): this {
    this.height = height;
    return this;
  }
  
  getArea(): number {
    return this.width * this.height;
  }
}

class Square extends Rectangle {
  setWidth(width: number): this {
    this.width = width;
    this.height = width;
    return this;
  }
  
  setHeight(height: number): this {
    this.width = height;
    this.height = height;
    return this;
  }
}

function renderLargeRectangles(rectangles: Rectangle[]) {
  rectangles.forEach((rectangle) => {
    const area = rectangle
      .setWidth(4)
      .setHeight(5)
      .getArea();
    // BAD: Returns 25 for Square. Should be 20.
    rectangle.render(area);
  });
}

const rectangles = [new Rectangle(), new Rectangle(), new Square()];
renderLargeRectangles(rectangles);
```

**Good:**
```typescript
abstract class Shape {
  setColor(color: string): this { /* ... */ }
  render(area: number) { /* ... */ }
  abstract getArea(): number;
}

class Rectangle extends Shape {
  constructor(
    private readonly width = 0,
    private readonly height = 0
  ) {
    super();
  }
  
  getArea(): number {
    return this.width * this.height;
  }
}

class Square extends Shape {
  constructor(private readonly length: number) {
    super();
  }
  
  getArea(): number {
    return this.length * this.length;
  }
}

function renderLargeShapes(shapes: Shape[]) {
  shapes.forEach((shape) => {
    const area = shape.getArea();
    shape.render(area);
  });
}

const shapes = [new Rectangle(4, 5), new Rectangle(4, 5), new Square(5)];
renderLargeShapes(shapes);
```

### Interface Segregation Principle (ISP)

Clients should not be forced to depend upon interfaces that they do not use.

**Bad:**
```typescript
interface SmartPrinter {
  print();
  fax();
  scan();
}

class AllInOnePrinter implements SmartPrinter {
  print() { /* ... */ }
  fax() { /* ... */ }
  scan() { /* ... */ }
}

class EconomicPrinter implements SmartPrinter {
  print() { /* ... */ }
  fax() { throw new Error('Fax not supported.'); }
  scan() { throw new Error('Scan not supported.'); }
}
```

**Good:**
```typescript
interface Printer {
  print();
}

interface Fax {
  fax();
}

interface Scanner {
  scan();
}

class AllInOnePrinter implements Printer, Fax, Scanner {
  print() { /* ... */ }
  fax() { /* ... */ }
  scan() { /* ... */ }
}

class EconomicPrinter implements Printer {
  print() { /* ... */ }
}
```

### Dependency Inversion Principle (DIP)

High-level modules should not depend on low-level modules. Both should depend on abstractions.

**Bad:**
```typescript
import { readFile as readFileCb } from 'fs';
import { promisify } from 'util';

const readFile = promisify(readFileCb);

type ReportData = { /* .. */ }

class XmlFormatter {
  parse<T>(content: string): T {
    // Converts an XML string to an object T
  }
}

class ReportReader {
  // BAD: We have created a dependency on a specific request implementation.
  private readonly formatter = new XmlFormatter();
  
  async read(path: string): Promise<ReportData> {
    const text = await readFile(path, 'UTF8');
    return this.formatter.parse<ReportData>(text);
  }
}

// ...
const reader = new ReportReader();
const report = await reader.read('report.xml');
```

**Good:**
```typescript
import { readFile as readFileCb } from 'fs';
import { promisify } from 'util';

const readFile = promisify(readFileCb);

type ReportData = { /* .. */ }

interface Formatter {
  parse<T>(content: string): T;
}

class XmlFormatter implements Formatter {
  parse<T>(content: string): T {
    // Converts an XML string to an object T
  }
}

class JsonFormatter implements Formatter {
  parse<T>(content: string): T {
    // Converts a JSON string to an object T
  }
}

class ReportReader {
  constructor(private readonly formatter: Formatter) { }
  
  async read(path: string): Promise<ReportData> {
    const text = await readFile(path, 'UTF8');
    return this.formatter.parse<ReportData>(text);
  }
}

// ...
const reader = new ReportReader(new XmlFormatter());
const report = await reader.read('report.xml');

// or if we had to read a json report
const reader = new ReportReader(new JsonFormatter());
const report = await reader.read('report.json');
```

## Testing

Testing is more important than shipping. If you have no tests or an inadequate amount, then every time you ship code you won't be sure that you didn't break anything.

### The three laws of TDD

1. You are not allowed to write any production code unless it is to make a failing unit test pass.
2. You are not allowed to write any more of a unit test than is sufficient to fail, and; compilation failures are failures.
3. You are not allowed to write any more production code than is sufficient to pass the one failing unit test.

### F.I.R.S.T. rules

Clean tests should follow the rules:

- **Fast** tests should be fast because we want to run them frequently.
- **Independent** tests should not depend on each other. They should provide same output whether run independently or all together in any order.
- **Repeatable** tests should be repeatable in any environment and there should be no excuse for why they fail.
- **Self-Validating** a test should answer with either Passed or Failed. You don't need to compare log files to answer if a test passed.
- **Timely** unit tests should be written before the production code. If you write tests after the production code, you might find writing tests too hard.

### Single concept per test

Tests should also follow the Single Responsibility Principle. Make only one assert per unit test.

**Bad:**
```typescript
import { assert } from 'chai';

describe('AwesomeDate', () => {
  it('handles date boundaries', () => {
    let date: AwesomeDate;
    
    date = new AwesomeDate('1/1/2015');
    assert.equal('1/31/2015', date.addDays(30));
    
    date = new AwesomeDate('2/1/2016');
    assert.equal('2/29/2016', date.addDays(28));
    
    date = new AwesomeDate('2/1/2015');
    assert.equal('3/1/2015', date.addDays(28));
  });
});
```

**Good:**
```typescript
import { assert } from 'chai';

describe('AwesomeDate', () => {
  it('handles 30-day months', () => {
    const date = new AwesomeDate('1/1/2015');
    assert.equal('1/31/2015', date.addDays(30));
  });
  
  it('handles leap year', () => {
    const date = new AwesomeDate('2/1/2016');
    assert.equal('2/29/2016', date.addDays(28));
  });
  
  it('handles non-leap year', () => {
    const date = new AwesomeDate('2/1/2015');
    assert.equal('3/1/2015', date.addDays(28));
  });
});
```

### The name of the test should reveal its intention

When a test fails, its name is the first indication of what may have gone wrong.

**Bad:**
```typescript
describe('Calendar', () => {
  it('2/29/2020', () => {
    // ...
  });
  
  it('throws', () => {
    // ...
  });
});
```

**Good:**
```typescript
describe('Calendar', () => {
  it('should handle leap year', () => {
    // ...
  });
  
  it('should throw when format is invalid', () => {
    // ...
  });
});
```

## Concurrency

### Prefer promises vs callbacks

Callbacks aren't clean, and they cause excessive amounts of nesting (the callback hell).

**Bad:**
```typescript
import { get } from 'request';
import { writeFile } from 'fs';

function downloadPage(url: string, saveTo: string, callback: (error: Error, content?: string) => void) {
  get(url, (error, response) => {
    if (error) {
      callback(error);
    } else {
      writeFile(saveTo, response.body, (error) => {
        if (error) {
          callback(error);
        } else {
          callback(null, response.body);
        }
      });
    }
  });
}

downloadPage('https://en.wikipedia.org/wiki/Robert_Cecil_Martin', 'article.html', (error, content) => {
  if (error) {
    console.error(error);
  } else {
    console.log(content);
  }
});
```

**Good:**
```typescript
import { get } from 'request';
import { writeFile } from 'fs';
import { promisify } from 'util';

const write = promisify(writeFile);

function downloadPage(url: string, saveTo: string): Promise<string> {
  return get(url)
    .then(response => write(saveTo, response));
}

downloadPage('https://en.wikipedia.org/wiki/Robert_Cecil_Martin', 'article.html')
  .then(content => console.log(content))
  .catch(error => console.error(error));
```

### Async/Await are even cleaner than Promises

With async/await syntax you can write code that is far cleaner and more understandable than chained promises.

**Bad:**
```typescript
import { get } from 'request';
import { writeFile } from 'fs';
import { promisify } from 'util';

const write = util.promisify(writeFile);

function downloadPage(url: string, saveTo: string): Promise<string> {
  return get(url).then(response => write(saveTo, response));
}

downloadPage('https://en.wikipedia.org/wiki/Robert_Cecil_Martin', 'article.html')
  .then(content => console.log(content))
  .catch(error => console.error(error));
```

**Good:**
```typescript
import { get } from 'request';
import { writeFile } from 'fs';
import { promisify } from 'util';

const write = promisify(writeFile);

async function downloadPage(url: string): Promise<string> {
  const response = await get(url);
  return response;
}

// somewhere in an async function
try {
  const content = await downloadPage('https://en.wikipedia.org/wiki/Robert_Cecil_Martin');
  await write('article.html', content);
  console.log(content);
} catch (error) {
  console.error(error);
}
```

## Error Handling

Thrown errors are a good thing! They mean the runtime has successfully identified when something in your program has gone wrong and it's letting you know by stopping function execution on the current stack, killing the process (in Node), and notifying you in the console with a stack trace.

### Always use Error for throwing or rejecting

JavaScript as well as TypeScript allow you to throw any object. A Promise can also be rejected with any reason object. It is advisable to use the throw syntax with an Error type.

**Bad:**
```typescript
function calculateTotal(items: Item[]): number {
  throw 'Not implemented.';
}

function get(): Promise<Item[]> {
  return Promise.reject('Not implemented.');
}
```

**Good:**
```typescript
function calculateTotal(items: Item[]): number {
  throw new Error('Not implemented.');
}

function get(): Promise<Item[]> {
  return Promise.reject(new Error('Not implemented.'));
}

// or equivalent to:
async function get(): Promise<Item[]> {
  throw new Error('Not implemented.');
}
```

### Don't ignore caught errors

Doing nothing with a caught error doesn't give you the ability to ever fix or react to said error.

**Bad:**
```typescript
try {
  functionThatMightThrow();
} catch (error) {
  console.log(error);
}

// or even worse
try {
  functionThatMightThrow();
} catch (error) {
  // ignore error
}
```

**Good:**
```typescript
import { logger } from './logging'

try {
  functionThatMightThrow();
} catch (error) {
  logger.log(error);
}
```

### Don't ignore rejected promises

For the same reason you shouldn't ignore caught errors from try/catch.

**Bad:**
```typescript
getUser()
  .then((user: User) => {
    return sendEmail(user.email, 'Welcome!');
  })
  .catch((error) => {
    console.log(error);
  });
```

**Good:**
```typescript
import { logger } from './logging'

getUser()
  .then((user: User) => {
    return sendEmail(user.email, 'Welcome!');
  })
  .catch((error) => {
    logger.log(error);
  });

// or using the async/await syntax:
try {
  const user = await getUser();
  await sendEmail(user.email, 'Welcome!');
} catch (error) {
  logger.log(error);
}
```

## Formatting

Formatting is subjective. Like many rules herein, there is no hard and fast rule that you must follow. The main point is DO NOT ARGUE over formatting. There are tons of tools to automate this.

For TypeScript there is a powerful tool called [ESLint](https://typescript-eslint.io/). It's a static analysis tool that can help you improve dramatically the readability and maintainability of your code.

### Use consistent capitalization

Capitalization tells you a lot about your variables, functions, etc. These rules are subjective, so your team can choose whatever they want. The point is, no matter what you all choose, just be consistent.

**Bad:**
```typescript
const DAYS_IN_WEEK = 7;
const daysInMonth = 30;
const songs = ['Back In Black', 'Stairway to Heaven', 'Hey Jude'];
const Artists = ['ACDC', 'Led Zeppelin', 'The Beatles'];

function eraseDatabase() {}
function restore_database() {}

type animal = { /* ... */ }
type Container = { /* ... */ }
```

**Good:**
```typescript
const DAYS_IN_WEEK = 7;
const DAYS_IN_MONTH = 30;
const SONGS = ['Back In Black', 'Stairway to Heaven', 'Hey Jude'];
const ARTISTS = ['ACDC', 'Led Zeppelin', 'The Beatles'];

const discography = getArtistDiscography('ACDC');
const beatlesSongs = SONGS.filter((song) => isBeatlesSong(song));

function eraseDatabase() {}
function restoreDatabase() {}

type Animal = { /* ... */ }
type Container = { /* ... */ }
```

Prefer using PascalCase for class, interface, type and namespace names. Prefer using camelCase for variables, functions and class members. Prefer using capitalized SNAKE_CASE for constants.

### Function callers and callees should be close

If a function calls another, keep those functions vertically close in the source file. Ideally, keep the caller right above the callee.

**Bad:**
```typescript
class PerformanceReview {
  constructor(private readonly employee: Employee) { }
  
  private lookupPeers() {
    return db.lookup(this.employee.id, 'peers');
  }
  
  private lookupManager() {
    return db.lookup(this.employee, 'manager');
  }
  
  private getPeerReviews() {
    const peers = this.lookupPeers();
    // ...
  }
  
  review() {
    this.getPeerReviews();
    this.getManagerReview();
    this.getSelfReview();
    // ...
  }
  
  private getManagerReview() {
    const manager = this.lookupManager();
  }
  
  private getSelfReview() {
    // ...
  }
}

const review = new PerformanceReview(employee);
review.review();
```

**Good:**
```typescript
class PerformanceReview {
  constructor(private readonly employee: Employee) { }
  
  review() {
    this.getPeerReviews();
    this.getManagerReview();
    this.getSelfReview();
    // ...
  }
  
  private getPeerReviews() {
    const peers = this.lookupPeers();
    // ...
  }
  
  private lookupPeers() {
    return db.lookup(this.employee.id, 'peers');
  }
  
  private getManagerReview() {
    const manager = this.lookupManager();
  }
  
  private lookupManager() {
    return db.lookup(this.employee, 'manager');
  }
  
  private getSelfReview() {
    // ...
  }
}

const review = new PerformanceReview(employee);
review.review();
```

### Organize imports

With clean and easy to read import statements you can quickly see the dependencies of current code.

**Bad:**
```typescript
import { TypeDefinition } from '../types/typeDefinition';
import { AttributeTypes } from '../model/attribute';
import { Customer, Credentials } from '../model/types';
import { ApiCredentials, Adapters } from './common/api/authorization';
import fs from 'fs';
import { ConfigPlugin } from './plugins/config/configPlugin';
import { BindingScopeEnum, Container } from 'inversify';
import 'reflect-metadata';
```

**Good:**
```typescript
import 'reflect-metadata';
import fs from 'fs';
import { BindingScopeEnum, Container } from 'inversify';
import { AttributeTypes } from '../model/attribute';
import { TypeDefinition } from '../types/typeDefinition';
import type { Customer, Credentials } from '../model/types';
import { ApiCredentials, Adapters } from './common/api/authorization';
import { ConfigPlugin } from './plugins/config/configPlugin';
```

### Use typescript aliases

Create prettier imports by defining the paths and baseUrl properties in the compilerOptions section in the tsconfig.json

**Bad:**
```typescript
import { UserService } from '../../../services/UserService';
```

**Good:**
```typescript
import { UserService } from '@services/UserService';
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@services": ["services/*"]
    }
  }
}
```

## Comments

The use of a comments is an indication of failure to express without them. Code should be the only source of truth.

Don't comment bad code—rewrite it. — Brian W. Kernighan and P. J. Plaugher

### Prefer self explanatory code instead of comments

Comments are an apology, not a requirement. Good code mostly documents itself.

**Bad:**
```typescript
// Check if subscription is active.
if (subscription.endDate > Date.now) { }
```

**Good:**
```typescript
const isSubscriptionActive = subscription.endDate > Date.now;
if (isSubscriptionActive) { /* ... */ }
```

### Don't leave commented out code in your codebase

Version control exists for a reason. Leave old code in your history.

**Bad:**
```typescript
type User = { 
  name: string; 
  email: string; 
  // age: number;
  // jobPosition: string;
}
```

**Good:**
```typescript
type User = { 
  name: string; 
  email: string; 
}
```

### Don't have journal comments

Remember, use version control! There's no need for dead code, commented code, and especially journal comments.

**Bad:**
```typescript
/**
 * 2016-12-20: Removed monads, didn't understand them (RM)
 * 2016-10-01: Improved using special monads (JP)
 * 2016-02-03: Added type-checking (LI)
 * 2015-03-14: Implemented combine (JR)
 */
function combine(a: number, b: number): number {
  return a + b;
}
```

**Good:**
```typescript
function combine(a: number, b: number): number {
  return a + b;
}
```

### Avoid positional markers

They usually just add noise. Let the functions and variable names along with the proper indentation and formatting give the visual structure to your code.

**Bad:**
```typescript
////////////////////////////////////////////////////////////////////////////////
// Client class
////////////////////////////////////////////////////////////////////////////////
class Client {
  id: number;
  name: string;
  address: Address;
  contact: Contact;
  
  ////////////////////////////////////////////////////////////////////////////////
  // public methods
  ////////////////////////////////////////////////////////////////////////////////
  public describe(): string {
    // ...
  }
  
  ////////////////////////////////////////////////////////////////////////////////
  // private methods
  ////////////////////////////////////////////////////////////////////////////////
  private describeAddress(): string {
    // ...
  }
  
  private describeContact(): string {
    // ...
  }
}
```

**Good:**
```typescript
class Client {
  id: number;
  name: string;
  address: Address;
  contact: Contact;
  
  public describe(): string {
    // ...
  }
  
  private describeAddress(): string {
    // ...
  }
  
  private describeContact(): string {
    // ...
  }
}
```

### TODO comments

When you find yourself that you need to leave notes in the code for some later improvements, do that using // TODO comments.

**Bad:**
```typescript
function getActiveSubscriptions(): Promise<Subscription[]> {
  // ensure `dueDate` is indexed.
  return db.subscriptions.find({ dueDate: { $lte: new Date() } });
}
```

**Good:**
```typescript
function getActiveSubscriptions(): Promise<Subscription[]> {
  // TODO: ensure `dueDate` is indexed.
  return db.subscriptions.find({ dueDate: { $lte: new Date() } });
}
```

---

## Conclusion

This guide provides a comprehensive set of guidelines for writing clean, maintainable TypeScript code. Remember that these are guidelines, not rigid rules. The most important principle is to write code that is readable, reusable, and refactorable.

Always prioritize:
- **Readability** - Code should be easy to understand
- **Simplicity** - Avoid over-engineering
- **Consistency** - Follow established patterns within your team
- **Testability** - Write code that can be easily tested

Happy coding! 🚀
