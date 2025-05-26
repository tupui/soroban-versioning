import type { FC } from "react";
import { useState, useEffect } from "react";
import Modal, { type ModalProps } from "components/utils/Modal";
import Button from "components/utils/Button";
import type { Member, Badge } from "../../../../packages/tansu";
import { Buffer } from "buffer";
import { getIpfsBasicLink } from "utils/utils";
import Markdown from "markdown-to-jsx";

interface Props extends ModalProps {
  member: Member;
}

interface ProfileData {
  name: string;
  description: string;
  social: string;
}

const badgeName = (b: Badge) => {
  switch (b) {
    case 10000000:
      return "Developer";
    case 5000000:
      return "Triage";
    case 1000000:
      return "Community";
    case 500000:
      return "Verified";
    case 1:
      return "Default";
    default:
      return b.toString();
  }
};

const MemberProfileModal: FC<Props> = ({ onClose, member }) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidMetadata, setHasValidMetadata] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      // Check if member has valid metadata (not empty, not just a space)
      if (member.meta && member.meta.trim() && member.meta.trim() !== " ") {
        try {
          setIsLoading(true);
          const ipfsUrl = getIpfsBasicLink(member.meta);

          // Fetch profile.json
          const profileResponse = await fetch(`${ipfsUrl}/profile.json`);
          if (profileResponse.ok) {
            const data = await profileResponse.json();
            setProfileData(data);
            setHasValidMetadata(true);
          }

          // Set profile image URL - try both extensions
          const imageExtensions = ["jpg", "jpeg", "png"];
          for (const ext of imageExtensions) {
            const imageUrl = `${ipfsUrl}/profile-image.${ext}`;
            try {
              const response = await fetch(imageUrl, { method: "HEAD" });
              if (response.ok) {
                setProfileImageUrl(imageUrl);
                break;
              }
            } catch (e) {
              // Continue to next extension
            }
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
          // Check if it's legacy metadata (not an IPFS CID)
          if (!member.meta.match(/^bafy/)) {
            setHasValidMetadata(true);
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [member.meta]);

  const noBadges = member.projects.every((p) => p.badges.length === 0);

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col gap-[30px] w-[360px] md:w-[700px]">
        <h2 className="text-2xl font-bold text-primary">Member Profile</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : profileData ? (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image and Basic Info */}
            <div className="flex flex-col items-center gap-4">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={profileData.name}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-primary"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-200 flex items-center justify-center">
                  <span className="text-4xl text-zinc-500">👤</span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-semibold text-primary">
                  {profileData.name || "Anonymous"}
                </h3>
                {profileData.social && (
                  <a
                    href={profileData.social}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline mt-1 block"
                  >
                    {profileData.social.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>

            {/* Description */}
            {profileData.description && (
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-primary mb-2">
                  About
                </h4>
                <div className="prose prose-sm max-w-none text-secondary">
                  <Markdown
                    options={{
                      overrides: {
                        p: {
                          props: {
                            className: "text-secondary mb-2",
                          },
                        },
                        a: {
                          props: {
                            className: "text-blue-500 hover:underline",
                          },
                        },
                        h1: {
                          props: {
                            className: "text-xl font-bold text-primary mb-2",
                          },
                        },
                        h2: {
                          props: {
                            className: "text-lg font-bold text-primary mb-2",
                          },
                        },
                        h3: {
                          props: {
                            className: "text-base font-bold text-primary mb-2",
                          },
                        },
                        ul: {
                          props: { className: "list-disc ml-5 text-secondary" },
                        },
                        ol: {
                          props: {
                            className: "list-decimal ml-5 text-secondary",
                          },
                        },
                      },
                    }}
                  >
                    {profileData.description}
                  </Markdown>
                </div>
              </div>
            )}
          </div>
        ) : hasValidMetadata && member.meta && !member.meta.match(/^bafy/) ? (
          // Legacy display for old metadata format
          <p className="text-base text-secondary break-words">
            Meta: {member.meta}
          </p>
        ) : (
          // No profile data
          <div className="text-center py-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-200 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-zinc-500">👤</span>
            </div>
            <p className="text-lg text-secondary">
              This member hasn't set up their profile yet.
            </p>
          </div>
        )}

        {/* Badges Section */}
        <div className="border-t pt-4">
          <h4 className="text-lg font-semibold text-primary mb-3">Badges</h4>
          {noBadges ? (
            <p className="text-base text-secondary">
              No badges earned yet. Start contributing to projects to earn your
              first badge!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {member.projects.map((proj, idx) => (
                <div key={idx} className="border p-3 rounded-lg">
                  <p className="font-medium text-primary mb-2 text-sm break-words">
                    Project:{" "}
                    {Buffer.from(proj.project).toString("hex").slice(0, 16)}...
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {proj.badges.map((b, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-primary text-white text-xs rounded-full"
                      >
                        {badgeName(b)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-[18px] mt-4">
          <Button type="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MemberProfileModal;
