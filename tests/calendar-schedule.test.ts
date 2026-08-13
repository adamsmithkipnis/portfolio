import assert from "node:assert/strict";
import test from "node:test";
import { getEventsForDay } from "../components/apps/calendar/utils";
import { DEFAULT_CALENDARS } from "../components/apps/calendar/data";

// Fixed reference week so the assertions do not drift with the clock.
// August 2026: 10th is a Monday, so this covers every weekday plus both weekend days.
const MONDAY = new Date(2026, 7, 10);
const THURSDAY = new Date(2026, 7, 13);
const SATURDAY = new Date(2026, 7, 15);
const SUNDAY = new Date(2026, 7, 16);
const WEEKDAYS = [0, 1, 2, 3, 4].map((offset) => new Date(2026, 7, 10 + offset));

function titles(day: Date): string[] {
  return getEventsForDay([], day).map((event) => event.title);
}

function find(day: Date, title: string) {
  return getEventsForDay([], day).filter((event) => event.title === title);
}

test("weekday mornings run the school run, dog park, then focus time", () => {
  for (const day of WEEKDAYS) {
    assert.deepEqual(find(day, "getting kids to school")[0]?.startTime, "07:00");
    assert.deepEqual(find(day, "getting kids to school")[0]?.endTime, "08:15");
    assert.deepEqual(find(day, "dog park")[0]?.startTime, "08:15");
    assert.deepEqual(find(day, "dog park")[0]?.endTime, "08:45");
  }
});

test("the school run is weekdays only", () => {
  assert.equal(find(SATURDAY, "getting kids to school").length, 0);
  assert.equal(find(SUNDAY, "getting kids to school").length, 0);
});

test("morning focus time ends at 12:30", () => {
  const morning = find(MONDAY, "focus time").find((event) => event.startTime === "09:00");
  assert.ok(morning, "expected a 9am focus block");
  assert.equal(morning.endTime, "12:30");
});

test("no busy block runs past 5pm, any day of the week", () => {
  // Sweep a full month so every meeting pattern in the rotation is exercised
  for (let dayOfMonth = 1; dayOfMonth <= 31; dayOfMonth += 1) {
    const day = new Date(2026, 7, dayOfMonth);
    for (const busy of find(day, "busy")) {
      assert.ok(
        busy.endTime !== undefined && busy.endTime <= "17:00",
        `busy block on Aug ${dayOfMonth} ends at ${busy.endTime}, past 17:00`
      );
    }
  }
});

test("dinner is 5:00-6:30 on weekdays", () => {
  for (const day of [MONDAY, THURSDAY]) {
    const dinners = find(day, "dinner");
    assert.equal(dinners.length, 1);
    assert.equal(dinners[0].startTime, "17:00");
    assert.equal(dinners[0].endTime, "18:30");
  }
});

test("weekends carry no focus time, busy blocks, or dinner", () => {
  // Sweep a full month so every weekend in the rotation is exercised
  for (let dayOfMonth = 1; dayOfMonth <= 31; dayOfMonth += 1) {
    const day = new Date(2026, 7, dayOfMonth);
    const dayOfWeek = day.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) continue;

    for (const title of ["focus time", "busy", "dinner"]) {
      assert.equal(
        find(day, title).length,
        0,
        `${title} still on the calendar for Aug ${dayOfMonth}`
      );
    }
  }
});

test("saturdays keep only soccer practice, sundays stay empty", () => {
  assert.deepEqual(titles(SATURDAY), ["soccer practice"]);
  assert.deepEqual(titles(SUNDAY), []);
});

test("the dog park is weekdays only", () => {
  for (const day of WEEKDAYS) {
    assert.equal(find(day, "dog park").length, 1);
  }
  assert.equal(find(SATURDAY, "dog park").length, 0);
  assert.equal(find(SUNDAY, "dog park").length, 0);
});

test("soccer practice renders blue, on the events calendar", () => {
  const soccer = find(SATURDAY, "soccer practice")[0];
  assert.ok(soccer, "expected soccer practice on Saturday");
  assert.equal(soccer.calendarId, "events");

  const blue = DEFAULT_CALENDARS.find((calendar) => calendar.id === soccer.calendarId);
  assert.equal(blue?.color, "#5B9BD5");
});

test("evening focus time is weeknights only", () => {
  for (const day of WEEKDAYS) {
    const evening = find(day, "focus time").find((event) => event.startTime === "21:00");
    assert.ok(evening, "expected a 9pm focus block on a weekday");
    assert.equal(evening.endTime, "22:00");
  }
  for (const day of [SATURDAY, SUNDAY]) {
    assert.equal(
      find(day, "focus time").some((event) => event.startTime === "21:00"),
      false
    );
  }
});

test("soccer practice is Saturday mornings only", () => {
  const soccer = find(SATURDAY, "soccer practice");
  assert.equal(soccer.length, 1);
  assert.equal(soccer[0].startTime, "10:00");
  assert.equal(soccer[0].endTime, "11:00");

  assert.equal(find(SUNDAY, "soccer practice").length, 0);
  assert.equal(find(MONDAY, "soccer practice").length, 0);
});

test("Egg lands on Easter Sunday, 2:30-3:30, every year", () => {
  // Western Easter dates, verified against the Gregorian computus
  const easters: Array<[number, number, number]> = [
    [2026, 3, 5],   // April 5, 2026
    [2027, 2, 28],  // March 28, 2027
    [2028, 3, 16],  // April 16, 2028
    [2029, 3, 1],   // April 1, 2029
    [2030, 3, 21],  // April 21, 2030
    [2035, 2, 25],  // March 25, 2035 - earliest in this range
    [2038, 3, 25],  // April 25, 2038 - latest possible Easter
  ];

  for (const [year, month, date] of easters) {
    const day = new Date(year, month, date);
    assert.equal(day.getDay(), 0, `Easter ${year} should be a Sunday`);

    const eggs = find(day, "Egg");
    assert.equal(eggs.length, 1, `expected one Egg on ${year}-${month + 1}-${date}`);
    assert.equal(eggs[0].startTime, "14:30");
    assert.equal(eggs[0].endTime, "15:30");
    assert.equal(eggs[0].isAllDay, false);
  }
});

test("Egg appears exactly once a year and never off Easter", () => {
  for (const year of [2026, 2027, 2028]) {
    let count = 0;
    for (let month = 0; month < 12; month += 1) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let date = 1; date <= daysInMonth; date += 1) {
        count += find(new Date(year, month, date), "Egg").length;
      }
    }
    assert.equal(count, 1, `expected exactly one Egg in ${year}, found ${count}`);
  }
});

test("the hacker meetup is Thursdays at Harry's", () => {
  const meetup = find(THURSDAY, "hacker meetup");
  assert.equal(meetup.length, 1);
  assert.equal(meetup[0].startTime, "22:00");
  assert.equal(meetup[0].endTime, "23:00");
  assert.match(meetup[0].location ?? "", /harry's bar/i);
  assert.match(meetup[0].location ?? "", /seattle/i);

  assert.equal(find(MONDAY, "hacker meetup").length, 0);
});

test("date night and the old exercise block are gone", () => {
  for (let dayOfMonth = 1; dayOfMonth <= 31; dayOfMonth += 1) {
    const dayTitles = titles(new Date(2026, 7, dayOfMonth));
    assert.equal(dayTitles.includes("date night"), false, `date night on Aug ${dayOfMonth}`);
    assert.equal(dayTitles.includes("exercise"), false, `exercise on Aug ${dayOfMonth}`);
  }
});

test("no sample event carries a San Francisco location", () => {
  for (let dayOfMonth = 1; dayOfMonth <= 31; dayOfMonth += 1) {
    for (const event of getEventsForDay([], new Date(2026, 7, dayOfMonth))) {
      assert.doesNotMatch(event.location ?? "", /, sf$|san francisco/i);
    }
  }
});

test("user events survive alongside the generated schedule", () => {
  const mine = {
    id: "mine",
    title: "one-on-one",
    startDate: "2026-08-10",
    endDate: "2026-08-10",
    startTime: "15:00",
    endTime: "15:30",
    isAllDay: false,
    calendarId: "meetings",
  };

  assert.ok(getEventsForDay([mine], MONDAY).some((event) => event.id === "mine"));
});
