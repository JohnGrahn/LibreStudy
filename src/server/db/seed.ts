import { AuthService } from '../services/auth';
import DeckModel from '../models/DeckModel';
import UserModel from '../models/UserModel';
import pool from './config';

const sampleDecks = [
  {
    title: 'Data Structures Fundamentals',
    description: 'Essential data structures in computer science',
    is_public: true,
    cards: [
      { front: 'What is an array?', back: 'A data structure consisting of a collection of elements, each identified by an index or a key' },
      { front: 'What is a linked list?', back: 'A linear data structure where elements are stored in nodes, and each node points to the next node in the sequence' },
      { front: 'What is a stack?', back: 'A LIFO (Last In, First Out) data structure that allows operations only at one end' },
      { front: 'What is a queue?', back: 'A FIFO (First In, First Out) data structure where elements are added at the rear and removed from the front' },
      { front: 'What is a binary tree?', back: 'A hierarchical data structure where each node has at most two children, referred to as left child and right child' },
      { front: 'What is a hash table?', back: 'A data structure that implements an associative array abstract data type, a structure that can map keys to values' },
      { front: 'What is a graph?', back: 'A non-linear data structure consisting of vertices (nodes) and edges that connect these vertices' },
      { front: 'What is a heap?', back: 'A specialized tree-based data structure that satisfies the heap property, commonly used to implement priority queues' },
      { front: 'What is a trie?', back: 'A tree-like data structure used to store a dynamic set of strings, commonly used for prefix-based operations' },
      { front: 'What is a BST?', back: 'A binary tree where the left subtree contains only nodes with keys less than the node\'s key, and the right subtree contains only nodes with keys greater than the node\'s key' }
    ]
  },
  {
    title: 'Algorithms and Complexity',
    description: 'Common algorithms and their time complexity analysis',
    is_public: true,
    cards: [
      { front: 'What is Big O notation?', back: 'A mathematical notation that describes the limiting behavior of a function when the argument tends towards a particular value or infinity' },
      { front: 'What is the time complexity of quicksort?', back: 'Average case: O(n log n), Worst case: O(n²)' },
      { front: 'What is binary search?', back: 'A search algorithm that finds the position of a target value within a sorted array by repeatedly dividing the search space in half' },
      { front: 'What is dynamic programming?', back: 'A method for solving complex problems by breaking them down into simpler subproblems and storing the results for future use' },
      { front: 'What is a greedy algorithm?', back: 'An algorithmic paradigm that makes the locally optimal choice at each step, hoping to find a global optimum' },
      { front: 'What is merge sort?', back: 'A divide-and-conquer algorithm that recursively breaks down a list into smaller sublists until each sublist consists of a single element, then merges those sublists' },
      { front: 'What is breadth-first search?', back: 'An algorithm for traversing tree or graph data structures that explores all vertices at the present depth before moving on to vertices at the next depth level' },
      { front: 'What is depth-first search?', back: 'An algorithm for traversing tree or graph data structures that explores as far as possible along each branch before backtracking' },
      { front: 'What is Dijkstra\'s algorithm?', back: 'An algorithm for finding the shortest paths between nodes in a weighted graph' },
      { front: 'What is the traveling salesman problem?', back: 'An NP-hard problem in combinatorial optimization, asking for the shortest possible route that visits each city exactly once and returns to the origin city' }
    ]
  },
  {
    title: 'Object-Oriented Programming',
    description: 'Core concepts of OOP and design patterns',
    is_public: true,
    cards: [
      { front: 'What is encapsulation?', back: 'A mechanism of bundling data and the methods that operate on that data within a single unit or object, hiding internal details' },
      { front: 'What is inheritance?', back: 'A mechanism that allows a class to inherit properties and methods from another class' },
      { front: 'What is polymorphism?', back: 'The ability of different classes to be treated as instances of the same class through base class inheritance' },
      { front: 'What is abstraction?', back: 'The process of hiding complex implementation details and showing only the necessary features of an object' },
      { front: 'What is a constructor?', back: 'A special method used to initialize objects of a class, called when an object is created' },
      { front: 'What is method overriding?', back: 'The ability of a subclass to provide a specific implementation of a method that is already defined in its parent class' },
      { front: 'What is the singleton pattern?', back: 'A design pattern that ensures a class has only one instance and provides a global point of access to it' },
      { front: 'What is the factory pattern?', back: 'A creational pattern that provides an interface for creating objects but allows subclasses to alter the type of objects that will be created' },
      { front: 'What is composition?', back: 'A design principle that favors object composition over class inheritance, allowing for more flexible designs' },
      { front: 'What is an interface?', back: 'A contract that specifies what methods a class must implement, defining a common behavior for multiple classes' }
    ]
  },
  {
    title: 'Web Development Fundamentals',
    description: 'Essential concepts in modern web development',
    is_public: true,
    cards: [
      { front: 'What is HTTP?', back: 'HyperText Transfer Protocol, the foundation of data communication on the World Wide Web' },
      { front: 'What is REST?', back: 'Representational State Transfer, an architectural style for distributed hypermedia systems' },
      { front: 'What is CORS?', back: 'Cross-Origin Resource Sharing, a mechanism that allows restricted resources to be requested from another domain' },
      { front: 'What is JWT?', back: 'JSON Web Token, a compact, URL-safe means of representing claims to be transferred between two parties' },
      { front: 'What is OAuth?', back: 'An open standard for access delegation, commonly used for secure authorization in web applications' },
      { front: 'What is a cookie?', back: 'A small piece of data stored on the user\'s computer by websites, used to remember stateful information' },
      { front: 'What is XSS?', back: 'Cross-Site Scripting, a type of security vulnerability that allows attackers to inject client-side scripts into web pages' },
      { front: 'What is CSRF?', back: 'Cross-Site Request Forgery, an attack that forces authenticated users to execute unwanted actions on a web application' },
      { front: 'What is a CDN?', back: 'Content Delivery Network, a geographically distributed network of proxy servers to provide high availability and performance' },
      { front: 'What is WebSocket?', back: 'A communication protocol that provides full-duplex communication channels over a single TCP connection' }
    ]
  },
  {
    title: 'Database Concepts',
    description: 'Fundamental database concepts and SQL',
    is_public: true,
    cards: [
      { front: 'What is ACID?', back: 'Properties of database transactions: Atomicity, Consistency, Isolation, and Durability' },
      { front: 'What is normalization?', back: 'The process of organizing data to reduce redundancy and improve data integrity' },
      { front: 'What is a primary key?', back: 'A column or set of columns that uniquely identifies each row in a table' },
      { front: 'What is a foreign key?', back: 'A field that creates a relationship between two tables by referencing the primary key of another table' },
      { front: 'What is an index?', back: 'A data structure that improves the speed of data retrieval operations on a database table' },
      { front: 'What is a transaction?', back: 'A unit of work that is performed against a database that is treated in a coherent and reliable way' },
      { front: 'What is a join?', back: 'An operation that combines rows from two or more tables based on a related column between them' },
      { front: 'What is a view?', back: 'A virtual table based on the result set of an SQL statement, can be queried like a regular table' },
      { front: 'What is a stored procedure?', back: 'A prepared SQL code that can be saved and reused multiple times' },
      { front: 'What is a trigger?', back: 'A special type of stored procedure that automatically runs when certain events occur in a database' }
    ]
  }
];

async function createCards(deckId: number, cards: { front: string; back: string }[]) {
  for (const card of cards) {
    await pool.query(
      'INSERT INTO cards (deck_id, front, back) VALUES ($1, $2, $3)',
      [deckId, card.front, card.back]
    );
  }
}

async function seed() {
  try {
    // Check required environment variables
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error('Missing required environment variables: ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set');
    }

    // Check if admin user already exists
    const adminExists = await AuthService.checkEmail(process.env.ADMIN_EMAIL);
    if (adminExists) {
      console.log('Admin user already exists, skipping seed');
      return;
    }

    // Create admin user
    const hashedPassword = await AuthService.hashPassword(process.env.ADMIN_PASSWORD);
    const adminUser = await UserModel.createUser({
      username: process.env.ADMIN_USERNAME,
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword
    });

    if (!adminUser) {
      throw new Error('Failed to create admin user');
    }

    // Create sample decks
    for (const deck of sampleDecks) {
      const newDeck = await DeckModel.createDeck({
        user_id: adminUser.id,
        title: deck.title,
        description: deck.description,
        is_public: deck.is_public
      });

      if (newDeck) {
        await createCards(newDeck.id, deck.cards);
      }
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seed; 