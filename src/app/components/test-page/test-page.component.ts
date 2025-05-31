import { Component } from '@angular/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ComponentBase } from '../component-base/component-base.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaginatedResult } from '../../../model/shared-models/paginated-result.model';
import { LazyLoadEvent } from 'primeng/api';
import { PaginationHelper } from '../../../utils/pagination-helper.utils';

interface Person {
  id?: number;
  firstName: string;
  lastName: string;
  age: number;
  birthDate: Date;
}

@Component({
  selector: 'app-test-page',
  imports: [
    FormsModule,
    CommonModule,
    TableModule,
  ],
  templateUrl: './test-page.component.html',
  styleUrl: './test-page.component.scss'
})
export class TestPageComponent extends ComponentBase {
  constructor() {
    super();

  }

  ngOnInit() {
    // this.totalCount = this.data.length;
  }

  itemHeight = 35;

  scrollOptions = {
    delay: 250,
  };

  pageCount: number = 40;

  async loadDataInternal(skip: number, limit: number) {
    const result = new Promise<any>((res, rej) => {
      setTimeout(() => {
        res(getData(skip, limit));
      }, 500);
    });

    return await result;
  }

  dataLoader = new PaginationHelper<Person>(this.loadDataInternal);

  loadData(event: TableLazyLoadEvent) {
    console.log(`Calling: ${event.first}, ${event.rows}`);
    this.dataLoader.loadData(event.first!, event.rows!, event);
  }
}


function getData(skip: number, limit: number): PaginatedResult<Person> {
  const data = testData.slice(skip, skip + limit);
  return {
    data: data,
    totalCount: testData.length
  };
}


export const testData: Person[] = [
  { firstName: 'Alice', lastName: 'Johnson', age: 29, birthDate: new Date('1994-05-15') },
  { firstName: 'Bob', lastName: 'Smith', age: 42, birthDate: new Date('1981-11-02') },
  { firstName: 'Carol', lastName: 'Williams', age: 35, birthDate: new Date('1988-07-22') },
  { firstName: 'David', lastName: 'Brown', age: 50, birthDate: new Date('1973-12-10') },
  { firstName: 'Eva', lastName: 'Davis', age: 23, birthDate: new Date('2000-03-05') },
  { firstName: 'Frank', lastName: 'Miller', age: 31, birthDate: new Date('1992-09-17') },
  { firstName: 'Grace', lastName: 'Wilson', age: 27, birthDate: new Date('1996-01-30') },
  { firstName: 'Henry', lastName: 'Moore', age: 38, birthDate: new Date('1985-06-11') },
  { firstName: 'Ivy', lastName: 'Taylor', age: 45, birthDate: new Date('1978-08-25') },
  { firstName: 'Jack', lastName: 'Anderson', age: 19, birthDate: new Date('2004-02-14') },
  { firstName: 'Kathy', lastName: 'Thomas', age: 28, birthDate: new Date('1995-12-09') },
  { firstName: 'Leo', lastName: 'Jackson', age: 33, birthDate: new Date('1990-04-18') },
  { firstName: 'Mona', lastName: 'White', age: 51, birthDate: new Date('1972-10-23') },
  { firstName: 'Nate', lastName: 'Harris', age: 22, birthDate: new Date('2001-01-07') },
  { firstName: 'Olivia', lastName: 'Martin', age: 39, birthDate: new Date('1984-03-30') },
  { firstName: 'Paul', lastName: 'Thompson', age: 26, birthDate: new Date('1997-08-02') },
  { firstName: 'Quinn', lastName: 'Garcia', age: 44, birthDate: new Date('1979-05-14') },
  { firstName: 'Rita', lastName: 'Martinez', age: 36, birthDate: new Date('1987-11-11') },
  { firstName: 'Sam', lastName: 'Robinson', age: 20, birthDate: new Date('2003-06-21') },
  { firstName: 'Tina', lastName: 'Clark', age: 48, birthDate: new Date('1975-09-29') },
  { firstName: 'Uma', lastName: 'Rodriguez', age: 30, birthDate: new Date('1993-02-17') },
  { firstName: 'Vic', lastName: 'Lewis', age: 53, birthDate: new Date('1970-12-05') },
  { firstName: 'Wendy', lastName: 'Lee', age: 24, birthDate: new Date('1999-03-08') },
  { firstName: 'Xander', lastName: 'Walker', age: 37, birthDate: new Date('1986-07-19') },
  { firstName: 'Yara', lastName: 'Hall', age: 21, birthDate: new Date('2002-04-11') },
  { firstName: 'Zane', lastName: 'Young', age: 47, birthDate: new Date('1976-01-25') },
  { firstName: 'Abby', lastName: 'King', age: 29, birthDate: new Date('1994-05-10') },
  { firstName: 'Brent', lastName: 'Scott', age: 34, birthDate: new Date('1989-09-15') },
  { firstName: 'Cathy', lastName: 'Green', age: 41, birthDate: new Date('1982-02-23') },
  { firstName: 'Dylan', lastName: 'Adams', age: 26, birthDate: new Date('1997-12-17') },
  { firstName: 'Elena', lastName: 'Baker', age: 39, birthDate: new Date('1984-11-04') },
  { firstName: 'Felix', lastName: 'Gonzalez', age: 32, birthDate: new Date('1991-03-19') },
  { firstName: 'Gina', lastName: 'Hernandez', age: 22, birthDate: new Date('2001-07-15') },
  { firstName: 'Hugo', lastName: 'Nelson', age: 45, birthDate: new Date('1978-06-30') },
  { firstName: 'Iris', lastName: 'Carter', age: 28, birthDate: new Date('1995-01-12') },
  { firstName: 'Jake', lastName: 'Mitchell', age: 50, birthDate: new Date('1973-10-29') },
  { firstName: 'Kira', lastName: 'Perez', age: 24, birthDate: new Date('1999-08-03') },
  { firstName: 'Liam', lastName: 'Roberts', age: 41, birthDate: new Date('1982-12-13') },
  { firstName: 'Maya', lastName: 'Turner', age: 36, birthDate: new Date('1987-04-07') },
  { firstName: 'Nick', lastName: 'Phillips', age: 35, birthDate: new Date('1988-01-22') },
  { firstName: 'Olive', lastName: 'Campbell', age: 45, birthDate: new Date('1978-09-04') },
  { firstName: 'Piper', lastName: 'Parker', age: 27, birthDate: new Date('1996-05-14') },
  { firstName: 'Quincy', lastName: 'Evans', age: 48, birthDate: new Date('1975-03-21') },
  { firstName: 'Rosie', lastName: 'Edwards', age: 29, birthDate: new Date('1994-11-06') },
  { firstName: 'Steve', lastName: 'Collins', age: 31, birthDate: new Date('1992-08-12') },
  { firstName: 'Tara', lastName: 'Stewart', age: 38, birthDate: new Date('1985-01-19') },
  { firstName: 'Uma', lastName: 'Sanchez', age: 49, birthDate: new Date('1974-02-28') },
  { firstName: 'Victor', lastName: 'Morris', age: 20, birthDate: new Date('2003-09-03') },
  { firstName: 'Willa', lastName: 'Rogers', age: 26, birthDate: new Date('1997-06-01') },
  { firstName: 'Xena', lastName: 'Reed', age: 34, birthDate: new Date('1989-07-23') },
  { firstName: 'Yvonne', lastName: 'Cook', age: 40, birthDate: new Date('1983-11-11') },
  { firstName: 'Zara', lastName: 'Bell', age: 29, birthDate: new Date('1994-02-07') },
  { firstName: 'Alan', lastName: 'Hughes', age: 37, birthDate: new Date('1986-08-16') },
  { firstName: 'Blaire', lastName: 'Flores', age: 21, birthDate: new Date('2002-03-22') },
  { firstName: 'Curt', lastName: 'Price', age: 49, birthDate: new Date('1974-12-19') },
  { firstName: 'Dawn', lastName: 'Sanders', age: 32, birthDate: new Date('1991-05-09') },
  { firstName: 'Ed', lastName: 'Ross', age: 23, birthDate: new Date('2000-01-31') },
  { firstName: 'Fiona', lastName: 'Morris', age: 35, birthDate: new Date('1988-10-04') },
  { firstName: 'Garry', lastName: 'Rivera', age: 44, birthDate: new Date('1979-06-17') },
  { firstName: 'Holly', lastName: 'Cooper', age: 30, birthDate: new Date('1993-08-12') },
  { firstName: 'Ian', lastName: 'Ward', age: 25, birthDate: new Date('1998-02-26') },
  { firstName: 'Joan', lastName: 'Bailey', age: 45, birthDate: new Date('1978-07-20') },
  { firstName: 'Kirk', lastName: 'Bennett', age: 38, birthDate: new Date('1985-11-13') },
  { firstName: 'Lola', lastName: 'James', age: 52, birthDate: new Date('1971-04-08') },
  { firstName: 'Matt', lastName: 'Barker', age: 19, birthDate: new Date('2004-01-15') },
  { firstName: 'Nina', lastName: 'Wright', age: 46, birthDate: new Date('1977-12-21') },
  { firstName: 'Owen', lastName: 'Ward', age: 21, birthDate: new Date('2002-06-09') },
  { firstName: 'Paula', lastName: 'Long', age: 42, birthDate: new Date('1981-03-16') },
  { firstName: 'Quin', lastName: 'Bridges', age: 25, birthDate: new Date('1998-10-05') },
  { firstName: 'Rick', lastName: 'Holland', age: 35, birthDate: new Date('1988-04-03') },
  { firstName: 'Sylvia', lastName: 'Price', age: 39, birthDate: new Date('1984-09-11') },
  { firstName: 'Tyler', lastName: 'Cruz', age: 22, birthDate: new Date('2001-07-30') },
  { firstName: 'Ursula', lastName: 'Bishop', age: 28, birthDate: new Date('1995-11-14') },
  { firstName: 'Victor', lastName: 'Scott', age: 33, birthDate: new Date('1990-12-29') },
  { firstName: 'Wanda', lastName: 'Howell', age: 34, birthDate: new Date('1989-05-25') },
  { firstName: 'Xander', lastName: 'Miller', age: 43, birthDate: new Date('1980-01-09') },
  { firstName: 'Yasmine', lastName: 'Garcia', age: 19, birthDate: new Date('2004-01-20') },
  { firstName: 'Zelda', lastName: 'Newton', age: 31, birthDate: new Date('1992-02-04') },
];

testData.forEach((t, i) => t.id = i);