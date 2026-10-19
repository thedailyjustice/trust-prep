/* TRUST Prep content (v1). Every lesson line and practice item is written only
   from Proof's fact sheet (review/faa-facts.md, checked 2026-10-18) and lists the
   fact entries it uses. Items are original practice items, not TRUST questions. */
(function () {
  'use strict';
  var CHECKED = '2026-10-18';

  // Source list copied from the fact sheet's "Sources fetched today" table.
  var SRC = {
    S1: ['FAA: The Recreational UAS Safety Test (TRUST)', 'https://www.faa.gov/uas/recreational_flyers/knowledge_test_updates'],
    S2: ['FAA: Recreational Flyers & Community-Based Organizations', 'https://www.faa.gov/uas/recreational_flyers'],
    S3: ['49 U.S.C. 44809 (U.S. Code, House OLRC)', 'https://uscode.house.gov/us/usc/119-120/t49/s44809/'],
    S4: ['FAA Advisory Circular 91-57D (PDF)', 'https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_91-57D.pdf'],
    S5: ['FAA FAQ: minimum age for TRUST', 'https://www.faa.gov/faq/what-minimum-age-individuals-required-take-trust'],
    S6: ['FAA Aeronautical Information Manual 11-5-1', 'https://www.faa.gov/air_traffic/publications/aim_html/chap11_section_5.html'],
    S7: ['FAA FAQ: What constitutes proof of passage?', 'https://www.faa.gov/faq/what-constitutes-proof-passage'],
    S8: ['FAA: Become a Certificated Remote Pilot (Part 107)', 'https://www.faa.gov/uas/commercial_operators/become_a_drone_pilot'],
    S9: ['FAA: B4UFLY', 'https://www.faa.gov/uas/getting_started/b4ufly'],
    S10: ['FAA: UAS Data Exchange (LAANC)', 'https://www.faa.gov/uas/getting_started/laanc'],
    S11: ['FAA: Airspace Authorizations for Recreational Flyers', 'https://www.faa.gov/uas/recreational_flyers/authorization'],
    S12: ['FAA: How to Register Your Drone', 'https://www.faa.gov/uas/getting_started/register_drone'],
    S13: ['14 CFR part 48 (eCFR)', 'https://www.ecfr.gov/current/title-14/chapter-I/subchapter-F/part-48'],
    S14: ['FAA: Remote Identification of Drones', 'https://www.faa.gov/uas/getting_started/remote_id'],
    S15: ['FAA: FAA-Recognized Identification Areas (FRIAs)', 'https://www.faa.gov/uas/getting_started/remote_id/fria'],
    S16: ['FAA: FAA-Recognized Community Based Organizations', 'https://www.faa.gov/uas/recreationalfliers/faa-recognized-community-based-organizations'],
    S17: ['FAA: Stadiums and Sporting Events', 'https://www.faa.gov/uas/getting_started/where_can_i_fly/airspace_restrictions/sports_stadiums'],
    S18: ['FAA: Airspace Restrictions', 'https://www.faa.gov/uas/getting_started/where_can_i_fly/airspace_restrictions'],
    S19: ['FAA: Temporary Flight Restrictions (TFRs)', 'https://www.faa.gov/uas/getting_started/temporary_flight_restrictions'],
    S20: ['FAA Drones & Wildfires Toolkit (PDF)', 'https://www.faa.gov/sites/faa.gov/files/uas/resources/community_engagement/FAA_drones_wildfires_toolkit.pdf'],
    S21: ['FAA Recreational Drone Flyers safety-tips flyer (PDF)', 'https://www.faa.gov/sites/faa.gov/files/uas/resources/community_engagement/recreational_flyers_toolkit/Rec_DroneFLyers_FLyer_AD_V2.pdf'],
    S22: ['FAA: Airspace 101', 'https://www.faa.gov/uas/getting_started/where_can_i_fly/airspace_101'],
    S23: ['FAA: TRUST Test Administrator Operating Rules (PDF)', 'https://www.faa.gov/sites/faa.gov/files/TA-Operating-Rules.pdf'],
    S24: ['FAA: TRUST for Industry', 'https://www.faa.gov/uas/recreational_flyers/knowledge_test_updates/trust_for_industry'],
    S25: ['FAA: Getting Started', 'https://www.faa.gov/uas/getting_started'],
    S26: ['FAA 2022 TRUST TA Application FAQ (PDF)', 'https://www.faa.gov/sites/faa.gov/files/TRUST-TA-FAQ-2022.pdf']
  };

  // Fact sheet entries used by the app -> the sources that entry cites.
  var FACTS = {
    '1.1': ['S1'], '1.2': ['S1', 'S2'], '1.3': ['S1'], '1.5': ['S6'], '1.7': ['S23'],
    '2.1': ['S5', 'S6'], '2.3': ['S12'], '2.4': ['S8', 'S6'],
    '3.1': ['S2'], '3.2': ['S2'], '3.3': ['S4', 'S2'], '3.4': ['S4'],
    '4.1': ['S2', 'S3'], '4.2': ['S4'],
    '5.1': ['S2', 'S4'], '5.2': ['S4'],
    '6.1': ['S2', 'S3', 'S22'], '6.2': ['S2'],
    '7.1': ['S21', 'S4'], '7.2': ['S17'], '7.3': ['S18'], '7.4': ['S19', 'S3'], '7.5': ['S20'],
    '8.1': ['S2', 'S3'], '8.2': ['S10', 'S11'], '8.3': ['S10'], '8.4': ['S10'], '8.5': ['S11', 'S4'], '8.6': ['S4'], '8.7': ['S9'],
    '9.1': ['S13', 'S12'], '9.2': ['S12'], '9.4': ['S2', 'S13', 'S12'], '9.5': ['S12'],
    '10.1': ['S14'], '10.2': ['S14', 'S2'], '10.3': ['S14'], '10.4': ['S15'],
    '11.1': ['S16'], '11.2': ['S4'], '11.3': ['S16'],
    '12.1': ['S4'], '12.2': ['S4'], '12.3': ['S4'], '12.4': ['S4'],
    '13.1': ['S1'], '13.2': ['S1', 'S7'], '13.3': ['S6'], '13.4': ['S3', 'S4', 'S2'],
    '14.1': ['S23', 'S1'],
    'APP': []
  };

  var TA_LIST_URL = 'https://www.faa.gov/uas/recreational_flyers/knowledge_test_updates#TAs';

  // Lesson line: [id, text, [fact ids]]
  // Item: { id, q, o: [options], a: index of correct option, e: explanation, f: [fact ids] }
  var MODULES = [
    { n: 1, slug: 'trust', title: 'What TRUST is',
      lesson: [
        ['L1.1', 'TRUST is The Recreational UAS Safety Test. If you fly a drone just for fun, the law says you must pass it before you fly.', ['1.1']],
        ['L1.2', 'TRUST is free, and you take it online.', ['1.2']],
        ['L1.3', 'The FAA writes the TRUST lessons and questions. Groups called test administrators run the test online. The FAA itself does not give you the test.', ['1.3']],
        ['L1.4', 'There is no FAA minimum age for TRUST. Kids of any age who want to fly for fun must pass it.', ['2.1']],
        ['L1.5', 'TRUST has knowledge check questions. You can correct your answers until you get them right, so everyone who finishes ends at 100%.', ['14.1']],
        ['L1.6', 'TRUST is once-and-done: no retesting is required. You don\'t need any training before it. If you ever need to, you can take it again any time.', ['1.5']],
        ['L1.7', 'Flying for work is different. It falls under Part 107. To fly under Part 107, you must be at least 16 and pass a different FAA test at a testing center.', ['2.4']]
      ],
      check: [
        { id: 'C1.1', q: 'Maya is 12. She wants to fly her drone for fun at a park. What does the law say about TRUST?', o: ['She is too young to take TRUST.', 'She must pass TRUST before she flies.', 'She only needs TRUST after she turns 16.'], a: 1, e: 'There is no FAA minimum age for TRUST. Anyone who flies for fun must pass it before flying.', f: ['2.1', '1.1'] },
        { id: 'C1.2', q: 'How much does TRUST cost?', o: ['Free', '$5', '$25'], a: 0, e: 'TRUST is free and online. $5 is the cost of recreational drone registration, not TRUST.', f: ['1.2', '9.2'] },
        { id: 'C1.3', q: 'You choose a wrong answer on a TRUST question. What happens?', o: ['You fail and must wait two weeks.', 'You can correct it until you get it right.', 'You have to pay to try again.'], a: 1, e: 'TRUST questions are correctable, so everyone who finishes ends at 100%.', f: ['14.1'] },
        { id: 'C1.4', q: 'How old must you be to fly for work under Part 107?', o: ['At least 13', 'At least 16', 'Any age'], a: 1, e: 'Part 107 pilots must be at least 16. TRUST, for fun flying, has no FAA minimum age.', f: ['2.4', '2.1'] }
      ] },
    { n: 2, slug: 'purpose', title: 'Recreational vs. work flying',
      lesson: [
        ['L2.1', 'Recreational means flying only for fun, or personal enjoyment. Flying for work or a business falls under a different rule, Part 107.', ['3.1']],
        ['L2.2', 'Not getting paid does not automatically make a flight "for fun."', ['3.2']],
        ['L2.3', 'These are all Part 107 flights: taking photos to help sell a house, inspecting a roof, and filming a school game for the school website.', ['3.2']],
        ['L2.4', 'Volunteering with your drone for a nonprofit can count as work flying too.', ['3.2']],
        ['L2.5', 'You can\'t mix fun and business in one flight.', ['3.3']],
        ['L2.6', 'If you are not sure, assume Part 107.', ['3.3']],
        ['L2.7', 'For teachers: flying for school instruction can count as recreational under federal guidance.', ['3.4']]
      ],
      check: [
        { id: 'C2.1', q: 'Jordan flies at the lake to make videos he will watch later just for fun. What kind of flight is this?', o: ['Recreational', 'Part 107 work flying'], a: 0, e: 'Flying only for personal enjoyment is recreational.', f: ['3.1'] },
        { id: 'C2.2', q: 'A neighbor asks you to take drone photos to help sell her house. She will not pay you. What kind of flight is this?', o: ['Recreational, because you are not paid', 'Part 107, because the photos help sell a house'], a: 1, e: 'Not getting paid does not make it a fun flight. Photos to help sell a house are a Part 107 flight.', f: ['3.2'] },
        { id: 'C2.3', q: 'You volunteer to take drone photos for a nonprofit group. Which is true?', o: ['It is always recreational because it is for a good cause.', 'It can count as work flying.', 'It is recreational as long as you are not paid.'], a: 1, e: 'Volunteering for a nonprofit can count as work flying. A good cause, or not getting paid, does not make a flight recreational.', f: ['3.2'] },
        { id: 'C2.4', q: 'You are not sure if your flight is for fun or for work. What should you assume?', o: ['That it is recreational', 'That it is Part 107', 'That no rules apply'], a: 1, e: 'When in doubt, assume Part 107.', f: ['3.3'] }
      ] },
    { n: 3, slug: 'vlos', title: 'Visual line of sight',
      lesson: [
        ['L3.1', 'You, or a visual observer right next to you, must be able to see your drone with your own eyes the whole flight. This is called visual line of sight.', ['4.1']],
        ['L3.2', 'Eyeglasses or contacts are fine. Binoculars or a screen do not count as "seeing" the drone.', ['4.2']],
        ['L3.3', 'You must also see the sky around the drone.', ['4.2']],
        ['L3.4', 'Or you can have a visual observer. The observer stands right next to you, can see the drone, and talks to you directly.', ['4.1']],
        ['L3.5', 'The observer should be close enough to talk to you without a phone or radio.', ['4.2']],
        ['L3.6', 'A visual observer is optional, but it lets you look away from the drone. You must have one if you fly with FPV goggles.', ['4.2']]
      ],
      check: [
        { id: 'C3.1', q: 'Which of these counts as keeping your drone in visual line of sight?', o: ['Watching it on your phone screen', 'Seeing it with your own eyes while wearing glasses', 'Looking at it through binoculars'], a: 1, e: 'Glasses or contacts are fine. Screens and binoculars do not count.', f: ['4.2'] },
        { id: 'C3.2', q: 'Where must your visual observer be?', o: ['Across the field, texting you', 'Right next to you, talking with you directly', 'At home, watching a live video'], a: 1, e: 'The observer must be right next to you and talk to you directly, without a phone or radio.', f: ['4.1', '4.2'] },
        { id: 'C3.3', q: 'You want to fly with FPV goggles on. What do you need?', o: ['A visual observer', 'Nothing extra', 'A bigger battery'], a: 0, e: 'A visual observer is required if you fly with FPV goggles.', f: ['4.2'] },
        { id: 'C3.4', q: 'What does a visual observer let you do?', o: ['Fly where neither of you can see it', 'Look away from the drone', 'Skip TRUST'], a: 1, e: 'An observer is optional, but lets you look away while they watch the drone. Someone must still see the drone the whole flight, and you still need TRUST.', f: ['4.2', '4.1'] }
      ] },
    { n: 4, slug: 'altitude', title: '400 ft in Class G',
      lesson: [
        ['L4.1', 'Class G is uncontrolled airspace. In Class G, fly at 400 feet above the ground or lower.', ['5.1']],
        ['L4.2', 'You do not need permission to fly in Class G at or below 400 feet.', ['5.1']],
        ['L4.3', '"Ground level" means the actual ground, not a roof or a tree.', ['5.2']],
        ['L4.4', 'So you can\'t launch from a tall building and then climb another 400 feet.', ['5.2']],
        ['L4.5', 'Some areas have a TFR (Temporary Flight Restriction) for a short time. Recreational flyers must follow TFRs, even in Class G.', ['7.4']]
      ],
      check: [
        { id: 'C4.1', q: 'In Class G airspace, how high may you fly for fun?', o: ['200 feet above the ground or lower', '400 feet above the ground or lower', 'As high as the drone can go'], a: 1, e: 'In Class G, fly at 400 feet above the ground or lower.', f: ['5.1'] },
        { id: 'C4.2', q: 'You launch from the roof of a 100-foot building in Class G. What is your limit?', o: ['400 feet above the ground', '400 feet above the roof', 'No limit, because you started high'], a: 0, e: 'Ground level is the actual ground, not a roof. You can\'t climb another 400 feet from a building.', f: ['5.2'] },
        { id: 'C4.3', q: 'Do you need FAA permission to fly at 200 feet in Class G airspace, with no TFR or other restriction there?', o: ['Yes', 'No'], a: 1, e: 'No. You don\'t need permission to fly in Class G at or below 400 feet, as long as no TFR or other restriction covers the area.', f: ['5.1', '7.4'] },
        { id: 'C4.4', q: 'A TFR covers your Class G flying field today. Can you fly there at 100 feet?', o: ['Yes, because 100 feet is under 400 feet', 'No, you must follow the TFR', 'Yes, if you have passed TRUST'], a: 1, e: 'Recreational flyers must follow TFRs.', f: ['7.4'] }
      ] },
    { n: 5, slug: 'yield', title: 'Give way to manned aircraft',
      lesson: [
        ['L5.1', 'Manned aircraft are airplanes and helicopters with people on board.', ['6.1']],
        ['L5.2', 'Drones always give way to manned aircraft and never get in their way.', ['6.1']],
        ['L5.3', 'Staying away from them is your job, not the other way around.', ['6.1']],
        ['L5.4', 'Planes and helicopters can fly low anywhere, not just near airports.', ['6.2']]
      ],
      check: [
        { id: 'C5.1', q: 'A medical helicopter is flying low toward your area. What should you do?', o: ['Keep flying. The helicopter will go around you.', 'Give way: move your drone away from it.', 'Fly closer to get a photo.'], a: 1, e: 'Drones always give way to manned aircraft. Staying away is your job.', f: ['6.1'] },
        { id: 'C5.2', q: 'A small airplane and your drone are getting close. Who must move away?', o: ['The airplane', 'You, with your drone', 'Whoever is higher'], a: 1, e: 'Drone pilots are responsible for staying away from manned aircraft, not the other way around.', f: ['6.1'] },
        { id: 'C5.3', q: 'Where can planes and helicopters fly low?', o: ['Only near airports', 'Anywhere, not just near airports', 'Nowhere below 1,000 feet'], a: 1, e: 'Planes and helicopters can fly low anywhere.', f: ['6.2'] },
        { id: 'C5.4', q: 'Which aircraft is a manned aircraft?', o: ['A helicopter with a pilot on board', 'Your 200-gram drone', 'A remote-control model airplane'], a: 0, e: 'Manned aircraft have people on board, like airplanes and helicopters. A drone or a remote-control model airplane has no one on board.', f: ['6.1'] }
      ] },
    { n: 6, slug: 'people', title: 'People, stadiums, and emergencies',
      lesson: [
        ['L6.1', 'FAA safety advice: never fly over groups of people or public events.', ['7.1']],
        ['L6.2', 'This is FAA safety advice, and the FAA encourages CBOs to put it in their safety guidelines. It is not one of the numbered rules in the law. The stadium and emergency rules below are bans.', ['7.1', '7.2', '7.3']],
        ['L6.3', 'Near big stadium events, you can\'t fly within 3 nautical miles of the stadium.', ['7.2']],
        ['L6.4', 'The ban runs from 1 hour before until 1 hour after the event.', ['7.2']],
        ['L6.5', 'It covers MLB baseball, NFL football, NCAA Division I football, and major NASCAR and IndyCar races.', ['7.2']],
        ['L6.6', 'Don\'t fly over emergencies or rescues, such as wildfires and hurricanes.', ['7.3']],
        ['L6.7', '"If you fly, we can\'t." When a drone shows up near a wildfire, firefighting aircraft may have to land.', ['7.5']],
        ['L6.8', 'A TFR is an area where flying is off-limits for a short time, for example during a wildfire, a hurricane, a big sports event, or a security situation. Always check before you fly.', ['7.4']]
      ],
      check: [
        { id: 'C6.1', q: 'A parade with hundreds of people is passing by. What does the FAA\'s safety advice say?', o: ['Fly right over the parade for the best view.', 'Never fly over groups of people or public events.', 'Fly over the crowd only if you stay under 400 feet.'], a: 1, e: 'FAA safety advice: never fly over groups of people or public events.', f: ['7.1'] },
        { id: 'C6.2', q: 'An NFL game is scheduled to start at 7:00 p.m. When does the drone ban near the stadium begin?', o: ['7:00 p.m.', '6:00 p.m.', 'At halftime'], a: 1, e: 'The ban starts 1 hour before the event and lasts until 1 hour after.', f: ['7.2'] },
        { id: 'C6.3', q: 'During those stadium events, how far from the stadium is drone flying banned?', o: ['100 feet', '1 nautical mile', '3 nautical miles'], a: 2, e: 'You can\'t fly within 3 nautical miles of the stadium.', f: ['7.2'] },
        { id: 'C6.4', q: 'Firefighters are working on a wildfire near your town. Why should you keep your drone away?', o: ['Firefighting aircraft may be grounded if a drone shows up.', 'The rule only applies to drones flying above 400 feet.', 'Only work drones must stay away; fun flights are fine.'], a: 0, e: 'Don\'t fly over emergencies like wildfires, at any height, for fun or for work. "If you fly, we can\'t": firefighting aircraft may be grounded when a drone shows up.', f: ['7.3', '7.5'] }
      ] },
    { n: 7, slug: 'airspace', title: 'Airspace and authorization (B4UFLY, LAANC/DroneZone)',
      lesson: [
        ['L7.1', 'Controlled airspace is mostly around airports. It includes Class B, C, D, and the surface part of Class E.', ['8.1']],
        ['L7.2', 'You need FAA permission before you fly there. You get it through LAANC or DroneZone.', ['8.1']],
        ['L7.3', 'LAANC is the fast way. You ask in an app from a company the FAA has approved, and you often get an answer almost right away.', ['8.2']],
        ['L7.4', 'LAANC only gives permission up to the altitude on the FAA\'s map (the UAS Facility Map). Recreational flyers can\'t ask to go higher.', ['8.2', '8.3']],
        ['L7.5', 'You can ask up to 90 days ahead. Register your drone and pass TRUST before you use LAANC.', ['8.2', '8.4']],
        ['L7.6', 'DroneZone is the FAA website for airports that don\'t have LAANC. A person reviews each request, so it is slow.', ['8.5']],
        ['L7.7', 'Don\'t call the airport tower to ask for permission.', ['8.6']],
        ['L7.8', 'B4UFLY shows where you can and can\'t fly. It is a map check, not permission. It comes in apps and websites from companies the FAA has approved.', ['8.7']]
      ],
      check: [
        { id: 'C7.1', q: 'You want to fly for fun near an airport in Class D airspace. What must you do first?', o: ['Check B4UFLY, then fly.', 'Use LAANC or DroneZone.', 'Call the airport tower.'], a: 1, e: 'Controlled airspace needs FAA permission first, and you get it through LAANC or DroneZone. B4UFLY is only a map check, not permission. Don\'t call the tower to ask.', f: ['8.1', '8.6', '8.7'] },
        { id: 'C7.2', q: 'B4UFLY shows that your spot is fine to fly. What is B4UFLY?', o: ['A map check of where you can and can\'t fly', 'Permission to fly in controlled airspace', 'Your TRUST certificate'], a: 0, e: 'B4UFLY is a map check, not permission.', f: ['8.7'] },
        { id: 'C7.3', q: 'LAANC approved you up to the altitude on the UAS Facility Map. You want to go higher. Can you ask?', o: ['Yes, any recreational flyer can ask.', 'No. That option is for Part 107 pilots only.'], a: 1, e: 'Recreational flyers can\'t ask to go higher than the map altitude.', f: ['8.3'] },
        { id: 'C7.4', q: 'The airport near you does not have LAANC. Where do you ask for permission?', o: ['DroneZone, the FAA website', 'The airport tower by phone', 'B4UFLY'], a: 0, e: 'DroneZone is for airports that don\'t have LAANC. A person reviews it, so ask early.', f: ['8.5'] }
      ] },
    { n: 8, slug: 'register', title: 'Registration (over 0.55 lb) and Remote ID',
      lesson: [
        ['L8.1', 'If your drone weighs more than 0.55 pounds (about 250 grams), you must register it with the FAA on DroneZone.', ['9.1']],
        ['L8.2', 'If it is lighter than that and you fly only for fun, you don\'t have to register it.', ['9.1']],
        ['L8.3', 'Recreational registration costs $5, covers all your drones, and lasts 3 years.', ['9.2']],
        ['L8.4', 'To register a drone, you must be 13 or older. If the owner is younger than 13, someone 13 or older has to register it.', ['2.3']],
        ['L8.5', 'Put your registration number on the outside of the drone before you fly. Keep proof of registration, on paper or digital, with you.', ['9.4']],
        ['L8.6', 'A drone registered for fun flying can\'t be used for Part 107 work flights.', ['9.5']],
        ['L8.7', 'Remote ID is like a digital license plate. While it flies, the drone broadcasts who it is and where it is.', ['10.1']],
        ['L8.8', 'If a drone has to be registered, or is registered, it must follow the Remote ID rule. This rule has applied since September 16, 2023.', ['10.2']],
        ['L8.9', 'There are three ways to follow the rule: fly a drone with built-in Remote ID, attach a Remote ID broadcast module and keep the drone in sight, or fly inside a FRIA.', ['10.3']],
        ['L8.10', 'A FRIA (FAA-Recognized Identification Area) is a special area where drones without Remote ID can fly. You and the drone both stay inside it, and you must see the drone the whole time.', ['10.4']]
      ],
      check: [
        { id: 'C8.1', q: 'Your drone weighs 900 grams. You fly it for fun. Must you register it?', o: ['Yes', 'No'], a: 0, e: 'Drones over 0.55 pounds (about 250 grams) must be registered.', f: ['9.1'] },
        { id: 'C8.2', q: 'Your drone weighs 100 grams, and you fly it only for fun. Must you register it?', o: ['Yes', 'No'], a: 1, e: 'Drones lighter than about 250 grams that fly only for fun don\'t need to be registered.', f: ['9.1'] },
        { id: 'C8.3', q: 'A 12-year-old owns a 600-gram drone. Who registers it?', o: ['The 12-year-old', 'A teen or adult', 'Nobody'], a: 1, e: 'You must be 13 or older to register a drone, so a teen or adult (13 or older) registers it, not the 12-year-old. A 600-gram drone is over 0.55 pounds, so it must be registered.', f: ['2.3', '9.1'] },
        { id: 'C8.4', q: 'Which is NOT a way to follow the Remote ID rule?', o: ['Fly a drone with built-in Remote ID', 'Attach a Remote ID broadcast module', 'Fly inside a FRIA', 'Write your name on the drone'], a: 3, e: 'The three ways are built-in Remote ID, a broadcast module, or flying in a FRIA. Writing your name on the drone is not Remote ID. (You do mark the outside with your registration number.)', f: ['10.3', '9.4'] }
      ] },
    { n: 9, slug: 'cbo', title: 'Community-based organization guidelines',
      lesson: [
        ['L9.1', 'CBO stands for community-based organization.', ['11.1']],
        ['L9.2', 'Recreational flyers must follow the safety guidelines of an FAA-recognized CBO.', ['11.1']],
        ['L9.3', 'You don\'t have to join the club. You just follow its guidelines.', ['11.1']],
        ['L9.4', 'If an FAA inspector or a police officer asks, you should be able to say which CBO\'s guidelines you are following.', ['11.2']],
        ['L9.5', 'Today the FAA lists four recognized CBOs: Academy of Model Aeronautics, First Person View Freedom Coalition, Flite Test Community Association, and STEM+C Inc.', ['11.3']]
      ],
      check: [
        { id: 'C9.1', q: 'Whose safety guidelines must every recreational flyer follow?', o: ['Any rules from an online video', 'An FAA-recognized CBO\'s safety guidelines', 'The drone maker\'s instruction manual'], a: 1, e: 'Recreational flyers must follow the safety guidelines of an FAA-recognized CBO. A video or the drone\'s manual can help, but it does not replace a CBO\'s safety guidelines.', f: ['11.1'] },
        { id: 'C9.2', q: 'Do you have to join a CBO to fly for fun?', o: ['Yes', 'No'], a: 1, e: 'No. You don\'t have to join a CBO. But you must follow the safety guidelines of an FAA-recognized CBO.', f: ['11.1'] },
        { id: 'C9.3', q: 'A police officer asks which safety guidelines you are flying under. What is a good answer?', o: ['Say "I don\'t know."', 'Name the CBO you follow.', 'Say "I don\'t need any."'], a: 1, e: 'Name the CBO whose guidelines you follow. Every recreational flyer must follow an FAA-recognized CBO\'s guidelines, so you do need them, and you should know which ones.', f: ['11.2', '11.1'] },
        { id: 'C9.4', q: 'Which group is on the FAA\'s list of recognized CBOs?', o: ['Academy of Model Aeronautics', 'Any club with "drone" in its name', 'The store that sold you the drone'], a: 0, e: 'The Academy of Model Aeronautics is one of the four recognized CBOs listed today.', f: ['11.3'] }
      ] },
    { n: 10, slug: 'preflight', title: 'Preflight checks and emergencies',
      lesson: [
        ['L10.1', 'These are good pilot habits the FAA recommends.', ['12.1']],
        ['L10.2', 'Before you fly, check the propellers, battery, and controls for damage.', ['12.1']],
        ['L10.3', 'Make sure the controller signal is strong and the battery has enough charge for the whole flight.', ['12.1']],
        ['L10.4', 'Check that GPS, compass, and return-to-home are working. Look over the area for people, aircraft, and obstacles.', ['12.1']],
        ['L10.5', 'Am I fit to fly? Use IMSAFE: Illness, Medication, Stress, Alcohol, Fatigue, Emotion.', ['12.2']],
        ['L10.6', 'Emergencies include losing the signal, losing power, losing GPS or losing sight of the drone, wrong readings, people or aircraft suddenly showing up, parts coming loose, battery fires, and sudden bad weather.', ['12.3']],
        ['L10.7', 'You are responsible in an emergency, and return-to-home may not be enough.', ['12.3']],
        ['L10.8', 'Return-to-home can fly in a straight line back to you, so it could pass over people or hit a tree or power lines.', ['12.4']]
      ],
      check: [
        { id: 'C10.1', q: 'Which is a good preflight check?', o: ['Check the propellers, battery, and controls for damage.', 'Fly straight up as high as it goes.', 'Skip checks if the drone is new.'], a: 0, e: 'Before you fly, check the propellers, battery, and controls for damage.', f: ['12.1'] },
        /* C10.2 text lives only here (Proof may tweak it) */ { id: 'C10.2', q: 'Why be careful with return-to-home?', o: ['It may fly back over people.', 'It always lands perfectly.', 'It turns off the controller.'], a: 0, e: 'Return-to-home can fly in a straight line back to you, so it could pass over people or hit trees or power lines. It does not always land perfectly, and it does not turn off the controller.', f: ['12.4'] },
        { id: 'C10.3', q: 'Which of these is an emergency?', o: ['The controller loses signal with the drone.', 'The battery shows full charge.', 'The sky is calm and clear.'], a: 0, e: 'Losing the signal is on the list of emergencies.', f: ['12.3'] },
        { id: 'C10.4', q: 'You stayed up very late and feel exhausted. Which IMSAFE letter tells you to think twice about flying?', o: ['F for Fatigue', 'M for Medication', 'A for Alcohol'], a: 0, e: 'IMSAFE: Illness, Medication, Stress, Alcohol, Fatigue, Emotion. Being exhausted is fatigue.', f: ['12.2'] }
      ] },
    { n: 11, slug: 'certificate', title: 'Certificate rules',
      lesson: [
        ['L11.1', 'When you finish TRUST, download, save, or print your certificate right away.', ['13.1']],
        ['L11.2', 'If you lose it, nobody can send you a new one. Test administrators don\'t keep a record of your certificate, so you have to take TRUST again.', ['13.2']],
        ['L11.3', 'TRUST is once-and-done: no retesting, as long as you keep your certificate.', ['13.3', '13.2']],
        ['L11.4', 'Carry your certificate, on paper or on a phone, when you fly. Show it if the FAA or a police officer asks.', ['13.4']],
        ['L11.5', 'This app is practice only. It is not TRUST, and it cannot give you a certificate.', ['1.7']]
      ],
      check: [
        { id: 'C11.1', q: 'You just finished TRUST. What should you do first?', o: ['Download, save, or print your certificate.', 'Close the page. The FAA will email it later.', 'Nothing. The FAA keeps a copy.'], a: 0, e: 'Download, save, or print it right away. No one keeps a copy for you.', f: ['13.1', '13.2'] },
        { id: 'C11.2', q: 'You lost your TRUST certificate. What now?', o: ['Ask the FAA to mail a new one.', 'Take TRUST again.', 'Keep flying without it.'], a: 1, e: 'If you lose it, nobody can send a new one. You take TRUST again.', f: ['13.2'] },
        { id: 'C11.3', q: 'Who can ask to see your TRUST certificate?', o: ['FAA or police', 'Only your teacher', 'Only a parent'], a: 0, e: 'The FAA or a police officer can ask to see your TRUST certificate, so carry it when you fly. It is not just for a teacher or a parent to check.', f: ['13.4'] },
        { id: 'C11.4', q: 'Which kind of proof can you carry?', o: ['Only a laminated paper copy', 'Paper or a copy on your phone', 'Just tell them you passed'], a: 1, e: 'Paper or electronic proof is fine, as long as you can show it.', f: ['13.4'] }
      ] }
  ];

  var QUIZ = [
    { id: 'Q1', q: 'Sam is 10 and wants to fly a 600-gram drone for fun. Which is true?', o: ['Sam is too young for TRUST, so a parent must take it for him.', 'Sam must pass TRUST, and someone 13 or older must register the drone.', 'Sam needs a Part 107 certificate because the drone must be registered.'], a: 1, e: 'TRUST has no FAA minimum age, so Sam takes it himself. A 600-gram drone must be registered, and someone 13 or older must do it. Part 107 is for work flying, not fun.', f: ['2.1', '2.3', '9.1', '3.1'] },
    { id: 'Q2', q: 'Who must be able to see the drone during a fun flight?', o: ['You, or a visual observer right next to you', 'A friend watching the video at home', 'Nobody, if the drone has GPS'], a: 0, e: 'You or a visual observer standing next to you must see the drone the whole flight.', f: ['4.1'] },
    { id: 'Q3', q: 'A roofing company asks you to fly over a roof and check it for damage. Which rules apply?', o: ['Recreational rules', 'Part 107'], a: 1, e: 'Roof inspections are Part 107 flights.', f: ['3.2'] },
    { id: 'Q4', q: 'In Class G airspace, what is the highest you may fly for fun?', o: ['400 feet above the ground', '400 feet above the tallest building', '1,000 feet'], a: 0, e: 'Fly at 400 feet above the actual ground or lower.', f: ['5.1', '5.2'] },
    { id: 'Q5', q: 'A small plane towing a banner flies low toward your drone. What do you do?', o: ['Move your drone away and give way.', 'Hold your spot. The plane must avoid you.', 'Fly next to it for a video.'], a: 0, e: 'Drones always give way to manned aircraft.', f: ['6.1'] },
    { id: 'Q6', q: 'An MLB baseball game ends at 4:00 p.m. When can drones fly near the stadium again?', o: ['4:00 p.m.', '5:00 p.m.', 'Never'], a: 1, e: 'The stadium ban lasts until 1 hour after the event.', f: ['7.2'] },
    { id: 'Q7', q: 'Which two ways give a recreational flyer FAA permission for controlled airspace?', o: ['LAANC and DroneZone', 'B4UFLY and a weather app', 'Calling the tower'], a: 0, e: 'Permission comes through LAANC or DroneZone. B4UFLY is only a map check.', f: ['8.1', '8.7'] },
    { id: 'Q8', q: 'Recreational drone registration costs $5. What does it cover?', o: ['All your drones, for 3 years', 'Only one drone, for 3 years', 'Only one drone, for 1 year'], a: 0, e: 'Recreational registration costs $5, covers all your drones, and lasts 3 years. It is not just for one drone, and it lasts 3 years, not 1.', f: ['9.2'] },
    { id: 'Q9', q: 'Which drones must follow the Remote ID rule?', o: ['Drones that have to be registered, or are registered', 'Only drones that are flown for work under Part 107', 'Only drones that carry a camera, for fun or work'], a: 0, e: 'If a drone has to be registered, or is registered, it must follow the Remote ID rule, whether it flies for fun or for work, with or without a camera.', f: ['10.2'] },
    { id: 'Q10', q: 'True or false: You must join a CBO to fly for fun.', o: ['True', 'False'], a: 1, e: 'You don\'t have to join. You must follow an FAA-recognized CBO\'s guidelines.', f: ['11.1'] },
    { id: 'Q11', q: 'Your drone is flying. Which of these is an emergency?', o: ['Losing sight of it', 'Taking a photo', 'Landing on time'], a: 0, e: 'Losing sight of the drone is on the list of emergencies. Taking a photo or landing on time is normal flying, not an emergency.', f: ['12.3'] },
    { id: 'Q12', q: 'You passed TRUST and still have your certificate. When do you have to take TRUST again?', o: ['Every year, before flying season', 'Every 2 years, like Part 107 training', 'Not at all. It is once-and-done.'], a: 2, e: 'TRUST is once-and-done, with no retesting. You only retake it if you lose your certificate. The every-24-months training rule is for Part 107 pilots.', f: ['13.3', '13.2', '2.4'] }
  ];

  var VO_CALLS = [
    { k: 'A', label: 'All clear: keep flying' },
    { k: 'B', label: 'Aircraft! Move away and give way' },
    { k: 'C', label: 'People below: move away from them' },
    { k: 'D', label: 'Lost sight: bring it back into view' },
    { k: 'E', label: 'Stop the flight and land' }
  ];
  var VO_SCENES = [
    { id: 'V1', icon: 'heli', t: 'A helicopter is flying low toward your field.', a: 'B', e: 'Drones always give way to manned aircraft.', f: ['6.1'] },
    { id: 'V2', icon: 'crowd', t: 'A crowd gathers under your drone for a public event.', a: 'C', e: 'FAA safety advice: never fly over groups of people or public events.', f: ['7.1'] },
    { id: 'V3', icon: 'trees', t: 'The drone drifts behind a row of tall trees. Neither of you can see it.', a: 'D', e: 'You or your observer must see the drone the whole flight. Losing sight is an emergency.', f: ['4.1', '12.3'] },
    { id: 'V4', icon: 'clear', t: 'Empty field in Class G. Clear sky. The drone is at 150 feet and in view.', a: 'A', e: 'In Class G at or below 400 feet, in sight, with no one around: keep flying and keep watching.', f: ['5.1', '4.1'] },
    { id: 'V5', icon: 'fire', t: 'Fire trucks arrive at a brush fire across the road.', a: 'E', e: 'Don\'t fly over emergencies. If you fly, firefighting aircraft may have to land.', f: ['7.3', '7.5'] },
    { id: 'V6', icon: 'plane', t: 'A small airplane is flying low in the distance, heading your way.', a: 'B', e: 'Planes can fly low anywhere. Staying away from them is your job.', f: ['6.1', '6.2'] },
    { id: 'V7', icon: 'signal', t: 'The controller warns that the signal is getting weak.', a: 'E', e: 'Losing the signal is an emergency. Land before it gets worse.', f: ['12.3'] },
    { id: 'V8', icon: 'wind', t: 'A sudden strong wind hits. The drone will not hold its spot.', a: 'E', e: 'Sudden bad weather is an emergency.', f: ['12.3'] },
    { id: 'V9', icon: 'sun', t: 'Sun glare blocks the pilot\'s view. You, the observer right next to them, still see the drone.', a: 'A', e: 'A visual observer next to the pilot lets the pilot look away.', f: ['4.2'] },
    { id: 'V10', icon: 'stadium', t: 'You are 1 mile from a stadium. An NFL game starts in 30 minutes.', a: 'E', e: 'No flying within 3 nautical miles from 1 hour before the game.', f: ['7.2'] }
  ];

  // Path game zones: . Class G, D Class D airport area, T TFR (wildfire), X stadium event, S start, F field.
  var PATH_LEVELS = [
    { id: 'P1', name: 'Park to field', rows: [
      'S..DD....',
      '...DD....',
      '.........',
      '.....TT..',
      '.....TT.F',
      '.........'] },
    { id: 'P2', name: 'Around the airport', rows: [
      '....DDD..',
      'S...DDD..',
      '....DDD..',
      '.........',
      '..XX.....',
      '..XX....F'] },
    { id: 'P3', name: 'Fire day', rows: [
      'S.T......',
      '..T..DD..',
      '..T..DD..',
      '.....DD..',
      'TT.......',
      '....TTT.F'] }
  ];
  var PATH_FACTS = [
    { id: 'G1', t: 'White squares are Class G. You may fly there at 400 feet or lower without asking first.', f: ['5.1'] },
    { id: 'G2', t: 'Blue squares are Class D around an airport. You would need FAA permission through LAANC or DroneZone. In this game you don\'t have it, so go around.', f: ['8.1'] },
    { id: 'G3', t: 'Red squares are a TFR for a wildfire. Stay out.', f: ['7.3', '7.4'] },
    { id: 'G4', t: 'Orange squares are a stadium during an NFL game. No drones.', f: ['7.2'] },
    { id: 'G5', t: 'Pick a height of 400 feet or lower.', f: ['5.1'] }
  ];
  var HOVER_FACTS = [
    { id: 'H1', t: 'The dashed line at the top is 400 feet, the Class G limit.', f: ['5.1'] },
    { id: 'H2', t: 'Wind can push your drone around. Sudden bad weather, like high wind, is an emergency.', f: ['12.3'] }
  ];


  // Tap-to-see word help, shown right where each term first appears in the lessons.
  // f: faa-facts.md entries the note rests on. nw: true = plain-English gloss NOT on the fact sheet
  // (new text for Proof's review; see review/new-text-round2.md).
  var GLOSS_HINT = 'Tap a word with a dotted underline to see what it means.';
  var GLOSS = [
    { id: 'W1', line: 'L1.1', w: 'UAS', d: 'UAS is short for unmanned aircraft system, another name for a drone and its controls', f: [], nw: true },
    { id: 'W2', line: 'L3.6', w: 'FPV goggles', d: 'FPV means first person view. FPV goggles show you what the drone\'s camera sees, so you are not looking at the drone itself', f: ['4.2'], nw: true },
    { id: 'W3', line: 'L4.1', w: 'uncontrolled airspace', d: 'airspace where you don\'t need FAA permission to fly for fun at 400 feet or lower', f: ['5.1'] },
    { id: 'W4', line: 'L6.3', w: 'nautical miles', d: 'a nautical mile is a unit sailors and pilots use. It is a bit longer than a regular mile', f: [], nw: true },
    { id: 'W5', line: 'L7.1', w: 'Controlled airspace', d: 'airspace where you need FAA permission before you fly, through LAANC or DroneZone', f: ['8.1'] },
    { id: 'W6', line: 'L7.1', w: 'the surface part of Class E', d: 'the part of Class E airspace that starts at the ground around an airport', f: ['8.1'], nw: true },
    { id: 'W7', line: 'L8.9', w: 'broadcast module', d: 'a device you attach to a drone so it broadcasts who it is and where it is', f: ['10.1', '10.3'] }
  ];

  window.TP_CONTENT = {
    CHECKED: CHECKED, SRC: SRC, FACTS: FACTS, TA_LIST_URL: TA_LIST_URL,
    MODULES: MODULES, QUIZ: QUIZ, VO_CALLS: VO_CALLS, VO_SCENES: VO_SCENES,
    PATH_LEVELS: PATH_LEVELS, PATH_FACTS: PATH_FACTS, HOVER_FACTS: HOVER_FACTS,
    GLOSS: GLOSS, GLOSS_HINT: GLOSS_HINT
  };
})();
