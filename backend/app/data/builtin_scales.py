"""
Built-in psychometric scales.

PASTE YOUR SCALE DATA HERE in the same format you showed:
    {"scale_name": "...", "id": "...", "text": "...", "scale_range": [min, max], "reverse_score": bool}

The loader will convert these to the canonical Scale format.
"""

# =============================================================================
# RWA2 - Right-Wing Authoritarianism (Altemeyer, 1996)
# 22 items, 1-7 Likert scale
# =============================================================================

RWA2_CITATION = "Altemeyer, B. (1996). The Authoritarian Specter. Harvard University Press."
RWA2_DESCRIPTION = "Right-Wing Authoritarianism Scale measuring authoritarian submission, authoritarian aggression, and conventionalism."

rwa2_questions = [
    {"scale_name": "RWA2", "id": "RWA2_1",  "text": "The established authorities generally turn out to be right about things, while the radicals and protestors are usually just loud mouths showing off their ignorance.",                            "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA2", "id": "RWA2_2",  "text": "Women should have to promise to obey their husbands when they get married.",    "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA2", "id": "RWA2_3",  "text": "Our country desperately needs a mighty leader who will do what has to be done to destroy the radical new ways and sinfulness that are ruining us.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA2", "id": "RWA2_4",  "text": "Gays and lesbians are just as healthy and moral as anybody else.",          "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA2", "id": "RWA2_5",  "text": "It is always better to trust the judgment of the proper authorities in government and religion than to listen to the noisy rabble-rousers in our society who are trying to create doubt in people's minds", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA2", "id": "RWA2_6",  "text": "Atheists and others who have rebelled against the established religions are no doubt every bit as good and virtuous as those who attend church regularly.",             "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA2", "id": "RWA2_7",  "text": "The only way our country can get through the crisis ahead is to get back to our traditional values, put some tough leaders in power, and silence the troublemakers spreading bad ideas",            "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA2", "id": "RWA2_8",  "text": "There is absolutely nothing wrong with nudist camps.", "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA2", "id": "RWA2_9",  "text": "Our country needs free thinkers who have the courage to defy traditional ways, even if this upsets many people",             "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA2", "id": "RWA2_10", "text": "Our country will be destroyed someday if we do not smash the perversions eating away at our moral fiber and traditional beliefs",  "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA2", "id": "RWA2_11", "text": "Everyone should have their own lifestyle religious beliefs and sexual preferences even if it makes them different from everyone else",                           "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA2", "id": "RWA2_12", "text": "The old-fashioned ways and the old-fashioned values still show the best way to live.",                 "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA2", "id": "RWA2_13", "text": "You have to admire those who challenged the law and the majority's view by protesting for women's abortion rights, for animal rights, or to abolish school prayer.",                                                             "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA2", "id": "RWA2_14", "text": "What our country really needs is a strong, determined leader who will crush evil, and take us back to our true path",                              "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA2", "id": "RWA2_15", "text": "Some of the best people in our country are those who are challenging our government, criticizing religion, and ignoring the normal way things are supposed to be done",         "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA2", "id": "RWA2_16", "text": "God's laws about abortion, pornography and marriage must be strictly followed before it is too late, and those who break them must be strongly punished", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA2", "id": "RWA2_17", "text": "There are many radical, immoral people in our country today, who are trying to ruin it for their own godless purposes, whom the authorities should put out of action.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA2", "id": "RWA2_18", "text": "A woman's place should be wherever she wants to be. The days when women are submissive to their husbands and social conventions belong strictly in the past.",      "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA2", "id": "RWA2_19", "text": "Our country will be great if we honor the ways of our forefathers, do what the authorities tell us to do, and get rid of the rotten apples who are ruining everything", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA2", "id": "RWA2_20", "text": "There is 'no one right way' to live life; everybody has to create their own way",        "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA2", "id": "RWA2_21", "text": "Homosexuals and feminists should be praised for being brave enough to defy traditional family values", "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA2", "id": "RWA2_22", "text": "This country would work a lot better if certain groups of troublemakers would just shut up and accept their group's traditional place in society",             "scale_range": [1,7], "reverse_score": False},

]


# =============================================================================
# RWA - Right-Wing Authoritarianism (Altemeyer, 1981)
# 34 items, 1-7 Likert scale
# =============================================================================

RWA_CITATION = "Altemeyer, B. (1981). Right-Wing Authoritarianism. University of Manitoba Press."
RWA_DESCRIPTION = "Original Right-Wing Authoritarianism Scale with subscales for aggression, submission, and conventionalism."

rwa_questions = [ 
    {"scale_name": "RWA", "id": "RWA_1",  "text": "Life imprisonment is justified for certain crimes.",                            "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_2",  "text": "Women should have to promise to obey their husbands when they get married.",    "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_3",  "text": "The established authorities in our country are usually smarter, better informed, and more competent than others are.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_4",  "text": "It is important to protect fully the rights of radicals and deviants.",          "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_5",  "text": "Our country desperately needs a mighty leader who will do what has to be done to destroy the radical new ways and sinfulness that are ruining us.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_6",  "text": "Gays and lesbians are just as healthy and moral as anybody else.",             "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_7",  "text": "Our country will be great if we honor the ways of our forefathers, do what the authorities tell us to do, and get rid of the “rotten apples” who are ruining everything.",            "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_8",  "text": "Atheists and others who have rebelled against established religion are no doubt every bit as good and virtuous as those who attend church regularly", "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_9",  "text": "The real keys to the 'good life' are obedience, discipline, and sticking to the straight and narrow.",             "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_10", "text": "A lot of our rules regarding modesty and sexual behavior are just customs which are not necessarily any better or holier than those which other people follow.",  "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_11", "text": "There are many radical, immoral people in our country today who are trying to ruin it for their own godless purposes, whom the authorities should put out of action.",                           "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_12", "text": "It is always better to trust the judgment of the proper authorities in government and religion than to listen to the noisy rabble-rousers in our society who are trying to create doubt in people’s minds.",                 "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_13", "text": "There is absolutely nothing wrong with nudist camps.",                                                             "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_14", "text": "There is no 'one right way' to live your life. Everybody has to create their own way.",                              "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_15", "text": "Our country will be destroyed someday if we do not smash the perversions eating away at our moral fiber and traditional beliefs.",         "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_16", "text": "It’s a mistake to “stick strictly to the straight and narrow” in life, for you’ll miss a lot of interesting people from quite different backgrounds who can change you, and some of the best experiences you can have", "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_17", "text": "The situation in our country is getting so serious, the strongest methods would be justified if they eliminated the troublemakers and got us back to our true path", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_18", "text": "It would be best for everyone if the proper authorities censored magazines so that people could not get their hands on trashy and disgusting material.",      "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_19", "text": "Everyone should have their own lifestyle, religious beliefs, and sexual preferences, even if it makes them different from everyone else.", "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_20", "text": "A “woman’s place” should be wherever she wants to be. The days when women are sub missive to their husbands and social conventions belong strictly in the past",        "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_21", "text": "What our country really needs is a strong, determined leader who will crush evil and take us back to our true path", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_22", "text": "People should pay less attention to the Bible and the other old traditional forms of religious guidance and instead develop their own personal standards of what is moral and immoral.",             "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_23", "text": "Enough is enough! If the loafers, deviants, and troublemakers won’t “shape up,” then they should be severely disciplined and taught a lesson they’ll never forget.",            "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_24", "text": "Our country needs freethinkers who will have the courage to defy traditional ways, even if this upsets many people", "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_25", "text": "There is nothing wrong with premarital sexual intercourse.",                                                        "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_26", "text": "It may be considered old-fashioned by some, but having a normal, proper appearance is still the mark of a gentleman and, especially, a lady.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_27", "text": "It is wonderful that young people today have greater freedom to protest against things they don’t like and to make their own “rules” to govern their behavior.", "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_28", "text": "What our country really needs, instead of more “civil rights,” is a good stiff dose of law and order.",              "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_29", "text": "Government, judges, and the police should never be allowed to censor books.*",                                       "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_30", "text": "Obedience and respect for authority are the most important virtues children should learn.",                          "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_31", "text": "We should treat protesters and radicals with open arms and open minds, since new ideas are the lifeblood of progressive change.",                                           "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_32", "text": "Once our government leaders and the authorities condemn the dangerous elements in our society, it will be the duty of every patriotic citizen to help stomp out the rot that is poisoning our country from within", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "RWA", "id": "RWA_33", "text": "Rules about being “well-behaved” and “respectable” should be changed in favor of greater freedom and new ways of living.",                                  "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "RWA", "id": "RWA_34", "text": "The facts on crime, sexual immorality, and recent public disorders all show we have to crack down harder on deviant groups and troublemakers if we are going to save our moral standards and preserve law and order", "scale_range": [1,7], "reverse_score": False},

]


# =============================================================================
# LWA - Left-Wing Authoritarianism (Costello et al., 2022)
# 39 items, 1-7 Likert scale
# =============================================================================

LWA_CITATION = "Costello, T. H., Bowes, S. M., Stevens, S. T., Waldman, I. D., Tasimi, A., & Lilienfeld, S. O. (2022). Clarifying the structure and nature of left-wing authoritarianism. Journal of Personality and Social Psychology."
LWA_DESCRIPTION = "Left-Wing Authoritarianism Scale measuring anti-hierarchical aggression, top-down censorship, and anti-conventionalism."

lwa_questions = [
    {"scale_name": "LWA", "id": "LWA_1",  "text": "The rich should be stripped of their belongings and status.",                                    "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_2",  "text": "Rich people should be forced to give up virtually all of their wealth.",                         "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_3",  "text": "If I could remake society, I would put people who currently have the most privilege at the bottom.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_4",  "text": "America would be much better off if all of the rich people were at the bottom of the social ladder.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_5",  "text": "When the tables are turned on the oppressors at the top of society, I will enjoy watching them suffer the violence that they have inflicted on so many others", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_6",  "text": "Most rich Wall Street executives deserve to be thrown in prison.",                                "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_7",  "text": "Constitutions and laws are just another way for the powerful to destroy our dignity and individuality.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_8",  "text": "The current system is beyond repair.",                                                           "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_9",  "text": "We need to replace the established order by any means necessary.",                               "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_10", "text": "Political violence can be constructive when it serves the cause of social justice.",             "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_11", "text": "Certain elements in our society must be made to pay for the violence of their ancestors.",        "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_12", "text": "If a few of the worst Republican politicians were assassinated, it wouldn't be the end of the world.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_13", "text": "I would prefer a far-left leader with absolute authority over a right-wing leader with limited power.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_14", "text": "Schools should be required by law to teach children about our country's history of racism, classism, sexism, and homophobia.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_15", "text": "Anyone who opposes gay marriage must be homophobic.",                                           "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_16", "text": "Deep down, just about all conservatives are racist, sexist, and homophobic.",                     "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_17", "text": "People truly worried about terrorism should shift their focus to the nutjobs on the far-right.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_18", "text": "The 'old-fashioned ways' and 'old-fashioned values' need to be abolished.",                        "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_19", "text": "Radical and progressive moral values can save our society.",                                     "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_20", "text": "All political conservatives are fools.",                                                         "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_21", "text": "I cannot imagine myself becoming friends with a political conservative.",                         "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_22", "text": "Conservatives are morally inferior to liberals.",                                                "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_23", "text": "It is important that we destroy the West's nationalist, imperialist values.",                     "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_24", "text": "I try to expose myself to conservative news sources.",                                           "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "LWA", "id": "LWA_25", "text": "There is nothing wrong with Bible camps.",                                                       "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "LWA", "id": "LWA_26", "text": "I hate being around nonprogressive people.",                                                     "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_27", "text": "Classroom discussions should be safe places that protect students from disturbing ideas.",        "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_28", "text": "University authorities are right to ban hateful speech from campus.",                            "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_29", "text": "I should have the right not to be exposed to offensive views.",                                  "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_30", "text": "To succeed, a workplace must ensure that its employees feel safe from criticism.",               "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_31", "text": "We must line up behind strong leaders who have the will to stamp out prejudice and intolerance.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_32", "text": "When we spend all of our time protecting the right to “free speech” we're protecting the rights of sexists, racists, and homophobes at the cost of marginalized people", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_33", "text": "I am in favor of allowing the government to shut down right-wing internet sites and blogs that promote nutty, hateful positions", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_34", "text": "Colleges and universities that permit speakers with intolerant views should be publicly condemned.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_35", "text": "Getting rid of inequality is more important than protecting the so-called 'right' to free speech.",  "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_36", "text": "Fox News, right-wing talk radio, and other conservative media outlets should be prohibited from broadcasting their views.",  "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "LWA", "id": "LWA_37", "text": "Even books that contain racism or racial language should not be censored.",                       "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "LWA", "id": "LWA_38", "text": "I don't support shutting down speakers with sexist, homophobic, or racist views.",               "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "LWA", "id": "LWA_39", "text": "Neo-Nazis ought to have a legal right to their opinions.",                                       "scale_range": [1,7], "reverse_score": True},

]


# =============================================================================
# MFQ - Moral Foundations Questionnaire (Graham et al., 2011)
# 36 items, 1-5 Likert scale
# =============================================================================

MFQ_CITATION = "Graham, J., Nosek, B. A., Haidt, J., Iyer, R., Koleva, S., & Ditto, P. H. (2011). Mapping the moral domain. Journal of Personality and Social Psychology."
MFQ_DESCRIPTION = "Moral Foundations Questionnaire measuring Care, Fairness, Loyalty, Authority, Purity, and Liberty foundations."

mfq_questions = [
    {"scale_name": "MFQ", "id": "MFQ_1",  "text": "Caring for people who have suffered is an important virtue.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_2",  "text": "The world would be a better place if everyone made the same amount of money.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_3",  "text": "I think people who are more hard-working should end up with more money.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_4",  "text": "I think children should be taught to be loyal to their country.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_5",  "text": "I think it is important for societies to cherish their traditional values.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_6",  "text": "I think the human body should be treated like a temple, housing something sacred within.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_7",  "text": "I believe that compassion for those who are suffering is one of the most crucial virtues.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_8",  "text": "Our society would have fewer problems if people had the same income.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_9",  "text": "I think people should be rewarded in proportion to what they contribute.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_10", "text": "It upsets me when people have no loyalty to their country.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_11", "text": "I feel that most traditions serve a valuable function in keeping society orderly.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_12", "text": "I believe chastity is an important virtue.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_13", "text": "We should all care for people who are in emotional pain.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_14", "text": "I believe that everyone should be given the same quantity of resources in life.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_15", "text": "The effort a worker puts into a job ought to be reflected in the size of a raise they receive.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_16", "text": "Everyone should love their own community.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_17", "text": "I think obedience to parents is an important virtue.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_18", "text": "It upsets me when people use foul language like it is nothing.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_19", "text": "I am empathetic toward those people who have suffered in their lives.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_20", "text": "I believe it would be ideal if everyone in society wound up with roughly the same amount of money.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_21", "text": "It makes me happy when people are recognized on their merits.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_22", "text": "Everyone should defend their country, if called upon.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_23", "text": "We all need to learn from our elders.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_24", "text": "If I found out that an acquaintance had an unusual but harmless sexual fetish I would feel uneasy about them.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_25", "text": "Everyone should try to comfort people who are going through something hard.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_26", "text": "When people work together toward a common goal, they should share the rewards equally, even if some worked harder on it.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_27", "text": "In a fair society, those who work hard should live with higher standards of living.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_28", "text": "Everyone should feel proud when a person in their community wins in an international competition.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_29", "text": "I believe that one of the most important values to teach children is to have respect for authority.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_30", "text": "People should try to use natural medicines rather than chemically identical human-made ones.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_31", "text": "It pains me when I see someone ignoring the needs of another human being.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_32", "text": "I get upset when some people have a lot more money than others in my country.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_33", "text": "I feel good when I see cheaters get caught and punished.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_34", "text": "I believe the strength of a sports team comes from the loyalty of its members to each other.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_35", "text": "I think having a strong leader is good for society.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "MFQ", "id": "MFQ_36", "text": "I admire people who keep their virginity until marriage.", "scale_range": [1,5], "reverse_score": False},
]


# =============================================================================
# NFC - Need for Cognition (Cacioppo & Petty, 1982)
# 18 items, -4 to 4 scale
# =============================================================================

NFC_CITATION = "Cacioppo, J. T., & Petty, R. E. (1982). The need for cognition. Journal of Personality and Social Psychology."
NFC_DESCRIPTION = "Need for Cognition Scale measuring tendency to engage in and enjoy effortful cognitive activities."

nfc_questions = [
    {"scale_name": "NFC", "id": "NFC_1", "text": "I really enjoy a task that involves coming up with new solutions to problems.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_2", "text": "I believe that if I think hard enough, I will be able to achieve my goals in life.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_3", "text": "I am very optimistic about my mental abilities.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_4", "text": "I would prefer a task that is intellectual, difficult, and important to one that is somewhat important but does not require much thought.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_5", "text": "I tend to set goals that can be accomplished only by expending considerable mental effort.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_6", "text": "When something I read confuses me, I just put it down and forget it.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_7", "text": "I take pride in the products of my reasoning.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_8", "text": "I don't usually think about problems that others have found to be difficult.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_9", "text": "I am usually tempted to put more thought into a task than the job minimally requires.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_10", "text": "Learning new ways to think doesn't excite me very much.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_11", "text": "I am hesitant about making important decisions after thinking about them.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_12", "text": "I usually end up deliberating about issues even when they do not affect me personally.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_13", "text": "I prefer just to let things happen rather than try to understand why they turned out that way.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_14", "text": "I have difficulty thinking in new and unfamiliar situations.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_15", "text": "The idea of relying on thought to make my way to the top does not appeal to me.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_16", "text": "The notion of thinking abstractly is not appealing to me.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_17", "text": "I am an intellectual.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_18", "text": "I find it especially satisfying to complete an important task that required a lot of thinking and mental effort.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_19", "text": "I only think as hard as I have to.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_20", "text": "I don't reason well under pressure.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_21", "text": "I like tasks that require little thought once I've learned them.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_22", "text": "I prefer to think about small, daily projects to long-term ones.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_23", "text": "I would rather do something that requires little thought than something that is sure to challenge my thinking abilities.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_24", "text": "I find little satisfaction in deliberating hard and for long hours.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_25", "text": "I think primarily because I have to.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_26", "text": "I more often talk with other people about the reasons for and possible solutions to international problems than about gossip or tidbits of what famous people are doing.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_27", "text": "These days, I see little chance for performing well, even in \"intellectual\" jobs, unless one knows the right people.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_28", "text": "More often than not, more thinking just leads to more errors.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_29", "text": "I don't like to have the responsibility of handling a situation that requires a lot of thinking.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_30", "text": "I appreciate opportunities to discover the strengths and weaknesses of my own reasoning.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_31", "text": "I feel relief rather than satisfaction after completing a task that required a lot of mental effort.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_32", "text": "Thinking is not my idea of fun.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_33", "text": "I try to anticipate and avoid situations where there is a likely chance I will have to think in depth about something.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_34", "text": "I don't like to be responsible for thinking of what I should be doing with my life.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_35", "text": "I prefer watching educational to entertainment programs.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_36", "text": "I often succeed in solving difficult problems that I set out to solve.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_37", "text": "I think best when those around me are very intelligent.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_38", "text": "I am not satisfied unless I am thinking.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_39", "text": "I prefer my life to be filled with puzzles that I must solve.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_40", "text": "I would prefer complex to simple problems.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_41", "text": "Simply knowing the answer rather than understanding the reasons for the answer to a problem is fine with me.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_42", "text": "When I am figuring out a problem, what I see as the solution to a problem is more important than what others believe or say is the solution.", "scale_range": [-4, 4], "reverse_score": False},
    {"scale_name": "NFC", "id": "NFC_43", "text": "It's enough for me that something gets the job done, I don't care how or why it works.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_44", "text": "Ignorance is bliss.", "scale_range": [-4, 4], "reverse_score": True},
    {"scale_name": "NFC", "id": "NFC_45", "text": "I enjoy thinking about an issue even when the results of my thought will have no effect on the outcome of the issue.", "scale_range": [-4, 4], "reverse_score": False}
]


# =============================================================================
# BFI-10 - Big Five Inventory (Rammstedt & John, 2007)
# 10 items, 1-5 Likert scale
# =============================================================================

BFI10_CITATION = "Rammstedt, B., & John, O. P. (2007). Measuring personality in one minute or less: A 10-item short version of the Big Five Inventory in English and German. Journal of Research in Personality, 41(1), 203-212."
BFI10_DESCRIPTION = "Big Five Inventory short form measuring Extraversion, Agreeableness, Conscientiousness, Neuroticism, and Openness personality traits."

bfi10_questions = [
    {"scale_name": "BFI-10", "id": "BFI10_1",  "text": "I see myself as someone who is reserved.", "scale_range": [1,5], "reverse_score": True},
    {"scale_name": "BFI-10", "id": "BFI10_2",  "text": "I see myself as someone who is generally trusting.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "BFI-10", "id": "BFI10_3",  "text": "I see myself as someone who tends to be lazy.", "scale_range": [1,5], "reverse_score": True},
    {"scale_name": "BFI-10", "id": "BFI10_4",  "text": "I see myself as someone who is relaxed, handles stress well.", "scale_range": [1,5], "reverse_score": True},
    {"scale_name": "BFI-10", "id": "BFI10_5",  "text": "I see myself as someone who has few artistic interests.", "scale_range": [1,5], "reverse_score": True},
    {"scale_name": "BFI-10", "id": "BFI10_6",  "text": "I see myself as someone who is outgoing, sociable.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "BFI-10", "id": "BFI10_7",  "text": "I see myself as someone who tends to find fault with others.", "scale_range": [1,5], "reverse_score": True},
    {"scale_name": "BFI-10", "id": "BFI10_8",  "text": "I see myself as someone who does a thorough job.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "BFI-10", "id": "BFI10_9",  "text": "I see myself as someone who gets nervous easily.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "BFI-10", "id": "BFI10_10", "text": "I see myself as someone who has an active imagination.", "scale_range": [1,5], "reverse_score": False},
]


# =============================================================================
# SDO-7 - Social Dominance Orientation (Ho et al., 2015)
# 8 items, 1-7 Likert scale
# =============================================================================

SDO7_CITATION = "Ho, A. K., Sidanius, J., Kteily, N., Sheehy-Skeffington, J., Pratto, F., Henkel, K. E., ... & Stewart, A. L. (2015). The nature of social dominance orientation: Theorizing and measuring preferences for intergroup inequality using the new SDO₇ scale. Journal of Personality and Social Psychology, 109(6), 1003."
SDO7_DESCRIPTION = "Social Dominance Orientation Scale measuring preferences for group-based hierarchy and dominance."

sdo7_questions = [
    {"scale_name": "SDO-7", "id": "SDO7_1", "text": "An ideal society requires some groups to be on top and others to be on the bottom.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "SDO-7", "id": "SDO7_2", "text": "Some groups of people are simply inferior to other groups.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "SDO-7", "id": "SDO7_3", "text": "No one group should dominate in society.", "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "SDO-7", "id": "SDO7_4", "text": "Groups at the bottom are just as deserving as groups at the top.", "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "SDO-7", "id": "SDO7_5", "text": "Group equality should not be our primary goal.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "SDO-7", "id": "SDO7_6", "text": "It is unjust to try to make groups equal.", "scale_range": [1,7], "reverse_score": False},
    {"scale_name": "SDO-7", "id": "SDO7_7", "text": "We should do what we can to equalize conditions for different groups.", "scale_range": [1,7], "reverse_score": True},
    {"scale_name": "SDO-7", "id": "SDO7_8", "text": "We should work to give all groups an equal chance to succeed.", "scale_range": [1,7], "reverse_score": True},
]


# =============================================================================
# RSES - Rosenberg Self-Esteem Scale (Rosenberg, 1965)
# 10 items, 1-4 Likert scale
# =============================================================================

RSES_CITATION = "Rosenberg, M. (1965). Society and the adolescent self-image. Princeton University Press."
RSES_DESCRIPTION = "Rosenberg Self-Esteem Scale measuring global self-worth and self-acceptance."

rses_questions = [
    {"scale_name": "RSES", "id": "RSES_1",  "text": "On the whole, I am satisfied with myself.", "scale_range": [1,4], "reverse_score": False},
    {"scale_name": "RSES", "id": "RSES_2",  "text": "At times I think I am no good at all.", "scale_range": [1,4], "reverse_score": True},
    {"scale_name": "RSES", "id": "RSES_3",  "text": "I feel that I have a number of good qualities.", "scale_range": [1,4], "reverse_score": False},
    {"scale_name": "RSES", "id": "RSES_4",  "text": "I am able to do things as well as most other people.", "scale_range": [1,4], "reverse_score": False},
    {"scale_name": "RSES", "id": "RSES_5",  "text": "I feel I do not have much to be proud of.", "scale_range": [1,4], "reverse_score": True},
    {"scale_name": "RSES", "id": "RSES_6",  "text": "I certainly feel useless at times.", "scale_range": [1,4], "reverse_score": True},
    {"scale_name": "RSES", "id": "RSES_7",  "text": "I feel that I'm a person of worth, at least on an equal plane with others.", "scale_range": [1,4], "reverse_score": False},
    {"scale_name": "RSES", "id": "RSES_8",  "text": "I wish I could have more respect for myself.", "scale_range": [1,4], "reverse_score": True},
    {"scale_name": "RSES", "id": "RSES_9",  "text": "All in all, I am inclined to feel that I am a failure.", "scale_range": [1,4], "reverse_score": True},
    {"scale_name": "RSES", "id": "RSES_10", "text": "I take a positive attitude toward myself.", "scale_range": [1,4], "reverse_score": False},
]


# =============================================================================
# GSE - General Self-Efficacy Scale (Schwarzer & Jerusalem, 1995)
# 10 items, 1-4 Likert scale
# =============================================================================

GSE_CITATION = "Schwarzer, R., & Jerusalem, M. (1995). Generalized Self-Efficacy scale. In J. Weinman, S. Wright, & M. Johnston, Measures in health psychology: A user's portfolio. Causal and control beliefs (pp. 35-37). Windsor, UK: NFER-NELSON."
GSE_DESCRIPTION = "General Self-Efficacy Scale measuring belief in one's competence to cope with challenging demands."

gse_questions = [
    {"scale_name": "GSE", "id": "GSE_1",  "text": "I can always manage to solve difficult problems if I try hard enough.", "scale_range": [1,4], "reverse_score": False},
    {"scale_name": "GSE", "id": "GSE_2",  "text": "If someone opposes me, I can find the means and ways to get what I want.", "scale_range": [1,4], "reverse_score": False},
    {"scale_name": "GSE", "id": "GSE_3",  "text": "It is easy for me to stick to my aims and accomplish my goals.", "scale_range": [1,4], "reverse_score": False},
    {"scale_name": "GSE", "id": "GSE_4",  "text": "I am confident that I could deal efficiently with unexpected events.", "scale_range": [1,4], "reverse_score": False},
    {"scale_name": "GSE", "id": "GSE_5",  "text": "Thanks to my resourcefulness, I know how to handle unforeseen situations.", "scale_range": [1,4], "reverse_score": False},
    {"scale_name": "GSE", "id": "GSE_6",  "text": "I can solve most problems if I invest the necessary effort.", "scale_range": [1,4], "reverse_score": False},
    {"scale_name": "GSE", "id": "GSE_7",  "text": "I can remain calm when facing difficulties because I can rely on my coping abilities.", "scale_range": [1,4], "reverse_score": False},
    {"scale_name": "GSE", "id": "GSE_8",  "text": "When I am confronted with a problem, I can usually find several solutions.", "scale_range": [1,4], "reverse_score": False},
    {"scale_name": "GSE", "id": "GSE_9",  "text": "If I am in trouble, I can usually think of a solution.", "scale_range": [1,4], "reverse_score": False},
    {"scale_name": "GSE", "id": "GSE_10", "text": "I can usually handle whatever comes my way.", "scale_range": [1,4], "reverse_score": False},
]


# =============================================================================
# LOT-R - Life Orientation Test-Revised (Scheier et al., 1994)
# 10 items (6 scored, 4 fillers), 1-5 Likert scale
# =============================================================================

LOTR_CITATION = "Scheier, M. F., Carver, C. S., & Bridges, M. W. (1994). Distinguishing optimism from neuroticism (and trait anxiety, self-mastery, and self-esteem): A reevaluation of the Life Orientation Test. Journal of Personality and Social Psychology, 67(6), 1063-1078."
LOTR_DESCRIPTION = "Life Orientation Test-Revised measuring dispositional optimism versus pessimism."

lotr_questions = [
    {"scale_name": "LOT-R", "id": "LOTR_1",  "text": "In uncertain times, I usually expect the best.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "LOT-R", "id": "LOTR_2",  "text": "It's easy for me to relax.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "LOT-R", "id": "LOTR_3",  "text": "If something can go wrong for me, it will.", "scale_range": [1,5], "reverse_score": True},
    {"scale_name": "LOT-R", "id": "LOTR_4",  "text": "I'm always optimistic about my future.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "LOT-R", "id": "LOTR_5",  "text": "I enjoy my friends a lot.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "LOT-R", "id": "LOTR_6",  "text": "It's important for me to keep busy.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "LOT-R", "id": "LOTR_7",  "text": "I hardly ever expect things to go my way.", "scale_range": [1,5], "reverse_score": True},
    {"scale_name": "LOT-R", "id": "LOTR_8",  "text": "I don't get upset too easily.", "scale_range": [1,5], "reverse_score": False},
    {"scale_name": "LOT-R", "id": "LOTR_9",  "text": "I rarely count on good things happening to me.", "scale_range": [1,5], "reverse_score": True},
    {"scale_name": "LOT-R", "id": "LOTR_10", "text": "Overall, I expect more good things to happen to me than bad.", "scale_range": [1,5], "reverse_score": False},
]


# =============================================================================
# Registry of all scales
# =============================================================================

BUILTIN_SCALES = {
    "RWA2": {
        "questions": rwa2_questions,
        "description": RWA2_DESCRIPTION,
        "citation": RWA2_CITATION,
    },
    "RWA": {
        "questions": rwa_questions,
        "description": RWA_DESCRIPTION,
        "citation": RWA_CITATION,
    },
    "LWA": {
        "questions": lwa_questions,
        "description": LWA_DESCRIPTION,
        "citation": LWA_CITATION,
    },
    "MFQ": {
        "questions": mfq_questions,
        "description": MFQ_DESCRIPTION,
        "citation": MFQ_CITATION,
    },
    "NFC": {
        "questions": nfc_questions,
        "description": NFC_DESCRIPTION,
        "citation": NFC_CITATION,
    },
    "BFI-10": {
        "questions": bfi10_questions,
        "description": BFI10_DESCRIPTION,
        "citation": BFI10_CITATION,
    },
    "SDO-7": {
        "questions": sdo7_questions,
        "description": SDO7_DESCRIPTION,
        "citation": SDO7_CITATION,
    },
    "RSES": {
        "questions": rses_questions,
        "description": RSES_DESCRIPTION,
        "citation": RSES_CITATION,
    },
    "GSE": {
        "questions": gse_questions,
        "description": GSE_DESCRIPTION,
        "citation": GSE_CITATION,
    },
    "LOT-R": {
        "questions": lotr_questions,
        "description": LOTR_DESCRIPTION,
        "citation": LOTR_CITATION,
    },
}
